// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IIssue } from "@/types/issue";
import { IssueBlockDate } from "./issue-layouts/properties/due-date";
import { PeekOverviewIssueProperties } from "./peek-overview/issue-properties";

vi.mock("next/navigation", () => ({ useParams: () => ({ anchor: "anchor" }) }));
vi.mock("@/hooks/store/publish", () => ({ usePublish: () => ({ project_details: { identifier: "FA1405" } }) }));
vi.mock("@/hooks/store/use-state", () => ({
  useStates: () => ({ getStateById: () => ({ name: "Custom English state", group: "completed" }) }),
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
    createElement("span", { "data-tooltip": label }, children),
}));

const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
let previous: boolean | undefined;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
  await initPromise;
  await setLanguage("en");
  previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  environment.IS_REACT_ACT_ENVIRONMENT = previous;
  await setLanguage("en");
});

const render = async (date: string | undefined) => {
  const issue = Object.freeze({ target_date: date, state_id: "state", priority: "high", sequence_id: 1 }) as IIssue;
  await act(async () =>
    root.render(
      createElement(
        TranslationProvider,
        null,
        createElement("section", { id: "block" }, createElement(IssueBlockDate, { due_date: date, stateId: "state" })),
        createElement(
          "section",
          { id: "start" },
          createElement(IssueBlockDate, {
            due_date: date,
            stateId: "state",
            dateLabel: "start_date",
            shouldHighLight: false,
          })
        ),
        createElement(
          "section",
          { id: "peek" },
          createElement(PeekOverviewIssueProperties, { issueDetails: issue, mode: "full" })
        )
      )
    )
  );
  expect(issue.target_date).toBe(date);
};
const block = () => container.querySelector("#block")!;
const peek = () => container.querySelector("#peek")!;

it.each([
  ["2024-03-20", "Mar 20, 2024", "فرو ۰۱, ۱۴۰۳"],
  ["2025-03-20", "Mar 20, 2025", "اسف ۳۰, ۱۴۰۳"],
  ["2025-03-21", "Mar 21, 2025", "فرو ۰۱, ۱۴۰۴"],
  ["2026-03-21", "Mar 21, 2026", "فرو ۰۱, ۱۴۰۵"],
])(
  "updates both published date consumers for %s without changing canonical dates or state data",
  async (iso, en, fa) => {
    await render(iso);
    expect(block().textContent).toBe(en);
    expect(block().querySelector("[data-tooltip]")?.getAttribute("data-tooltip")).toBe(`Due date: ${en}`);
    expect(peek().textContent).toContain(en);
    await act(async () => setLanguage("fa"));
    expect(block().textContent).toBe(fa);
    expect(block().querySelector("[data-tooltip]")?.getAttribute("data-tooltip")).toBe(`موعد انجام: ${fa}`);
    expect(container.querySelector("#start [data-tooltip]")?.getAttribute("data-tooltip")).toBe(`تاریخ شروع: ${fa}`);
    expect(peek().querySelector('button[aria-label="کپی پیوند"]')).not.toBeNull();
    expect(peek().textContent).toContain(fa);
    expect(peek().textContent).toContain("Custom English state");
    expect(block().querySelector(".text-danger-primary")).toBeNull();
    await act(async () => setLanguage("en"));
    expect(block().textContent).toBe(en);
    expect(peek().textContent).toContain(en);
  }
);

it.each([undefined, "invalid"])("keeps empty/invalid dates safe and localized: %s", async (empty) => {
  await render(empty);
  expect(block().textContent).toBe("None");
  await act(async () => setLanguage("fa"));
  expect(block().textContent).toBe("هیچ‌کدام");
});
