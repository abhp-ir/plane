// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { AppliedDateFilters as CycleDateFilters } from "@/components/cycles/applied-filters/date";
import { InboxIssueAppliedFiltersDate } from "@/components/inbox/inbox-filter/applied-filters/date";
import { AppliedDateFilters as IssueDateFilters } from "@/components/issues/issue-layouts/filters/applied-filters/date";
import { AppliedDateFilters as ModuleDateFilters } from "@/components/modules/applied-filters/date";

const { updateIntake } = vi.hoisted(() => ({ updateIntake: vi.fn() }));
const values = ["2025-03-20;after", "2025-03-21;before"];
vi.mock("@/hooks/store/use-project-inbox", () => ({
  useProjectInbox: () => ({ inboxFilters: { created_at: values }, handleInboxIssueFilters: updateIntake }),
}));

it("updates mounted filter date labels without changing canonical removal values", async () => {
  await initPromise;
  await setLanguage("en");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const removeCycle = vi.fn();
  const removeModule = vi.fn();
  const removeIssue = vi.fn();
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(
            "section",
            { id: "cycle" },
            createElement(CycleDateFilters, { values, editable: true, handleRemove: removeCycle })
          ),
          createElement(
            "section",
            { id: "module" },
            createElement(ModuleDateFilters, { values, editable: true, handleRemove: removeModule })
          ),
          createElement(
            "section",
            { id: "issue" },
            createElement(IssueDateFilters, { values, handleRemove: removeIssue })
          ),
          createElement(
            "section",
            { id: "intake" },
            createElement(InboxIssueAppliedFiltersDate, { filterKey: "created_at", label: "Created date" })
          )
        )
      )
    );
    const english = container.textContent;
    expect(english?.match(/After Mar 20, 2025/g)).toHaveLength(4);
    await act(async () => setLanguage("fa"));
    expect(container.textContent?.match(/After اسف ۳۰, ۱۴۰۳/g)).toHaveLength(4);
    expect(container.textContent?.match(/Before فرو ۰۱, ۱۴۰۴/g)).toHaveLength(4);
    expect(container.textContent).not.toContain("2025");
    await act(async () => {
      container.querySelector<HTMLButtonElement>("#cycle button")!.click();
      container.querySelector<HTMLButtonElement>("#module button")!.click();
      container.querySelector<HTMLButtonElement>("#issue button")!.click();
      container.querySelector<HTMLButtonElement>("#intake button")!.click();
    });
    expect(removeCycle).toHaveBeenCalledExactlyOnceWith("2025-03-20;after");
    expect(removeModule).toHaveBeenCalledExactlyOnceWith("2025-03-20;after");
    expect(removeIssue).toHaveBeenCalledExactlyOnceWith("2025-03-20;after");
    expect(updateIntake).toHaveBeenCalledExactlyOnceWith("created_at", ["2025-03-21;before"]);
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>("#intake button")].at(-1)!.click());
    expect(updateIntake).toHaveBeenLastCalledWith("created_at", undefined);
    await act(async () => setLanguage("en"));
    expect(container.textContent).toBe(english);
    await act(async () => setLanguage("fa"));
    expect(container.textContent?.match(/After اسف ۳۰, ۱۴۰۳/g)).toHaveLength(4);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    updateIntake.mockClear();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
