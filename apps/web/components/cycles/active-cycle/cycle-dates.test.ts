// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { ActiveCycleStats } from "./cycle-stats";

const mocks = vi.hoisted(() => ({ peek: vi.fn(), filters: vi.fn(), fetch: vi.fn() }));
const issue = {
  id: "issue",
  name: "می‌رود ABC-42",
  target_date: "2025-03-20T22:00:00Z",
  priority: "high",
  state_id: "custom-state",
  archived_at: null,
};
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({ issue: { getIssueById: () => issue }, setPeekIssue: mocks.peek }),
}));
vi.mock("@/hooks/store/use-issues", () => ({
  useIssues: () => ({ issues: { fetchNextActiveCycleIssues: mocks.fetch } }),
}));
vi.mock("@/hooks/use-intersection-observer", () => ({ useIntersectionObserver: () => undefined }));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
    createElement("span", { "data-tooltip": label }, children),
}));
vi.mock("@/components/core/sidebar/single-progress-stats", () => ({ SingleProgressStats: () => null }));
vi.mock("@/components/dropdowns/state/state-select", () => ({
  StateSelect: () => createElement("button", { type: "button", disabled: true }, "Custom English state"),
}));
vi.mock("@/components/issues/issue-detail/issue-identifier", () => ({
  IssueIdentifier: () => createElement("button", { type: "button", disabled: true }, "FA-42"),
}));
vi.mock("@/components/empty-state/simple-empty-state-root", () => ({ SimpleEmptyState: () => null }));

it("updates mounted cycle due labels across locales while preserving civil dates and priority/peek actions", async () => {
  await initPromise;
  await setLanguage("en");
  const previousTab = localStorage.getItem("activeCycleTab");
  localStorage.setItem("activeCycleTab", JSON.stringify("Priority-Issues"));
  const consoleError = vi.spyOn(console, "error");
  const before = JSON.stringify(issue);
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const fullDate = () => container.querySelector('[data-tooltip^="Target Date:"]')?.getAttribute("data-tooltip");
  const shortDate = () => container.querySelector("span.truncate.text-11")?.textContent;
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(ActiveCycleStats, {
            workspaceSlug: "owned",
            projectId: "project",
            cycle: null,
            cycleId: "cycle",
            handleFiltersUpdate: mocks.filters,
            cycleIssueDetails: {
              issueIds: ["issue"],
              issueCount: 1,
              nextCursor: "",
              nextPageResults: false,
              perPageCount: 1,
            },
          })
        )
      )
    );
    expect(fullDate()).toBe("Target Date: Mar 20, 2025");
    expect(shortDate()).toBe("Mar 20");
    await act(async () => setLanguage("fa"));
    expect(fullDate()).toBe("Target Date: اسف ۳۰, ۱۴۰۳");
    expect(shortDate()).toBe("اسف ۳۰");
    expect(container.textContent).toContain(issue.name);
    const titleButton = container.querySelector<HTMLButtonElement>('[role="tabpanel"] .group button:not([disabled])')!;
    await act(async () => titleButton.click());
    expect(mocks.peek).toHaveBeenCalledExactlyOnceWith({
      workspaceSlug: "owned",
      projectId: "project",
      issueId: "issue",
      isArchived: false,
    });
    expect(mocks.filters).toHaveBeenCalledExactlyOnceWith([
      { property: "priority", operator: "in", value: ["urgent", "high"] },
    ]);
    expect(titleButton.type).toBe("button");
    titleButton.focus();
    expect(document.activeElement).toBe(titleButton);
    const dueButton = container.querySelector<HTMLButtonElement>('[data-tooltip^="Target Date:"] button')!;
    expect(dueButton.type).toBe("button");
    await act(async () => dueButton.click());
    expect(mocks.peek).toHaveBeenCalledTimes(2);
    expect(mocks.peek.mock.calls.every(([value]) => value.issueId === issue.id)).toBe(true);
    expect(mocks.filters).toHaveBeenCalledTimes(2);
    expect(container.querySelector("button button")).toBeNull();
    const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs).toHaveLength(3);
    await act(async () => tabs[1].click());
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(localStorage.getItem("activeCycleTab")).toBe(JSON.stringify("Assignees"));
    await act(async () => tabs[0].click());
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(consoleError.mock.calls.filter(([message]) => String(message).includes("default value state"))).toHaveLength(
      0
    );
    await act(async () => setLanguage("en"));
    expect(fullDate()).toBe("Target Date: Mar 20, 2025");
    expect(shortDate()).toBe("Mar 20");
    expect(JSON.stringify(issue)).toBe(before);
    expect(mocks.fetch).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    if (previousTab === null) localStorage.removeItem("activeCycleTab");
    else localStorage.setItem("activeCycleTab", previousTab);
    consoleError.mockRestore();
    vi.clearAllMocks();
    await setLanguage("en");
  }
});
