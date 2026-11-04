// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { FilterAccess } from "@/components/project/dropdowns/filters/access";
import { FilterStatus as CycleStatus } from "@/components/cycles/dropdowns/filters/status";
import { FilterStatus as ModuleStatus } from "@/components/modules/dropdowns/filters/status";
import { FilterLead as ProjectLead } from "@/components/project/dropdowns/filters/lead";
import { FilterMembers as ProjectMembers } from "@/components/project/dropdowns/filters/members";
import { FilterLead as ModuleLead } from "@/components/modules/dropdowns/filters/lead";
import { FilterMembers as ModuleMembers } from "@/components/modules/dropdowns/filters/members";
import { FilterCreatedBy } from "@/components/common/filters/created-by";
import { FilterPriority } from "@/components/inbox/inbox-filter/filters/priority";
import { FilterMember as IntakeMembers } from "@/components/inbox/inbox-filter/filters/members";
import { InboxIssueAppliedFiltersPriority } from "@/components/inbox/inbox-filter/applied-filters/priority";
import { InboxIssueAppliedFiltersStatus } from "@/components/inbox/inbox-filter/applied-filters/status";
import { InboxIssueAppliedFiltersState } from "@/components/inbox/inbox-filter/applied-filters/state";
import { InboxIssueAppliedFiltersLabel } from "@/components/inbox/inbox-filter/applied-filters/label";
import { InboxIssueAppliedFiltersMember } from "@/components/inbox/inbox-filter/applied-filters/member";

vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
const { updateIntake, members } = vi.hoisted(() => ({
  updateIntake: vi.fn(),
  members: Array.from({ length: 7 }, (_, i) => ({
    id: `member-${i}`,
    display_name: `Imported Alex-${i}`,
    avatar_url: null,
  })),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({ getUserDetails: (id: string) => members.find((member) => member.id === id) }),
}));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: members[0] }) }));
vi.mock("@/hooks/store/use-project-inbox", () => ({
  useProjectInbox: () => ({
    inboxFilters: {
      priority: ["high"],
      assignees: ["member-0"],
      status: [-2, 0],
      state: ["custom-state"],
      labels: ["custom-label"],
    },
    handleInboxIssueFilters: updateIntake,
  }),
}));
vi.mock("@/hooks/store/use-project-state", () => ({
  useProjectState: () => ({
    getStateById: () => ({ id: "custom-state", name: "Imported English state", group: "unstarted", color: "#000000" }),
  }),
}));
vi.mock("@/hooks/store/use-label", () => ({
  useLabel: () => ({ getLabelById: () => ({ id: "custom-label", name: "API label-42", color: "#000000" }) }),
}));

async function mounted(
  run: (container: HTMLDivElement, render: (children: ReactNode) => Promise<void>) => Promise<void>
) {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await run(container, async (children) => {
      await act(async () => root.render(createElement(TranslationProvider, null, children)));
    });
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    updateIntake.mockClear();
    await setLanguage("en");
  }
}
const button = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll("button")].find(
    (node) => (node.querySelector(".text-caption-sm-regular")?.textContent ?? node.textContent) === name
  );

it.each([
  [
    "access",
    "عمومی",
    "2",
    (query: string, update: (value: string) => void) =>
      createElement(FilterAccess, { searchQuery: query, appliedFilters: ["2"], handleUpdate: update }),
  ],
  [
    "cycle",
    "تکمیل‌شده",
    "completed",
    (query: string, update: (value: string) => void) =>
      createElement(CycleStatus, { searchQuery: query, appliedFilters: ["completed"], handleUpdate: update }),
  ],
  [
    "module",
    "تکمیل‌شده",
    "completed",
    (query: string, update: (value: string) => void) =>
      createElement(ModuleStatus, { searchQuery: query, appliedFilters: ["completed"], handleUpdate: update }),
  ],
] as const)(
  "searches translated %s choices and preserves canonical callbacks",
  async (_owner, name, value, renderFilter) => {
    await mounted(async (container, render) => {
      const update = vi.fn();
      await render(renderFilter(name, update));
      expect(container.textContent).toContain("(۱)");
      expect(container.textContent).not.toMatch(/[A-Za-z0-9]/);
      expect(button(container, name)?.getAttribute("aria-pressed")).toBe("true");
      await act(async () => button(container, name)!.click());
      expect(update).toHaveBeenCalledExactlyOnceWith(value);
      await render(renderFilter("no-such-option", update));
      expect(container.textContent).toContain("مورد منطبقی پیدا نشد");
      await act(async () => setLanguage("en"));
      expect(container.textContent).toContain("No matches found");
      expect(update).toHaveBeenCalledTimes(1);
    });
  }
);

it.each([ProjectLead, ProjectMembers, ModuleLead, ModuleMembers, FilterCreatedBy])(
  "updates member search on mounted language changes and keeps imported names",
  async (Component) => {
    await mounted(async (container, render) => {
      const update = vi.fn();
      const props = { memberIds: members.map(({ id }) => id), appliedFilters: ["member-0"], handleUpdate: update };
      await render(createElement(Component, { ...props, searchQuery: "شما" }));
      expect(container.textContent).toContain("(۱)");
      expect(button(container, "شما")?.getAttribute("aria-pressed")).toBe("true");
      await act(async () => button(container, "شما")!.click());
      expect(update).toHaveBeenCalledExactlyOnceWith("member-0");
      await act(async () => setLanguage("en"));
      expect(container.textContent).toContain("No matches found");
      await act(async () => setLanguage("fa"));
      expect(button(container, "شما")).toBeDefined();
      await render(createElement(Component, { ...props, searchQuery: "" }));
      expect(container.textContent).toContain("Imported Alex-1");
      const more = button(container, "نمایش همه")!;
      expect(more.className).toContain("ms-8");
      await act(async () => more.click());
      expect(container.textContent).toContain("Imported Alex-6");
      expect(button(container, "نمایش کمتر")).toBeDefined();
      expect(update).toHaveBeenCalledTimes(1);
    });
  }
);

it("localizes Intake priority and member choices without changing their API keys", async () => {
  await mounted(async (container, render) => {
    await render(createElement(FilterPriority, { searchQuery: "بالا" }));
    expect(container.textContent).toContain("(۱)");
    expect(button(container, "بالا")?.getAttribute("aria-pressed")).toBe("true");
    await act(async () => button(container, "بالا")!.click());
    expect(updateIntake).toHaveBeenCalledExactlyOnceWith("priority", []);
    await render(
      createElement(IntakeMembers, {
        filterKey: "assignees",
        memberIds: members.map(({ id }) => id),
        searchQuery: "شما",
      })
    );
    expect(button(container, "شما")?.getAttribute("aria-pressed")).toBe("true");
    await act(async () => button(container, "شما")!.click());
    expect(updateIntake).toHaveBeenLastCalledWith("assignees", []);
  });
});

it("keeps custom Intake names and exposes localized native removal controls with unchanged payloads", async () => {
  await mounted(async (container, render) => {
    await render(
      createElement(
        "div",
        null,
        createElement(InboxIssueAppliedFiltersPriority),
        createElement(InboxIssueAppliedFiltersStatus),
        createElement(InboxIssueAppliedFiltersState),
        createElement(InboxIssueAppliedFiltersLabel),
        createElement(InboxIssueAppliedFiltersMember, { filterKey: "assignees", label: "مسئول" })
      )
    );
    expect(container.textContent).not.toMatch(/High|Status|State|Label/);
    await act(async () => {
      for (const name of ["Imported English state", "API label-42", "Imported Alex-0"]) {
        const remove = [...container.querySelectorAll("button")].find(
          (node) => node.getAttribute("aria-label") === `حذف: ${name}`
        )!;
        expect(remove).toBeDefined();
        expect([...container.querySelectorAll('[dir="auto"]')].some((node) => node.textContent === name)).toBe(true);
        remove.click();
      }
    });
    expect(updateIntake.mock.calls).toEqual([
      ["state", []],
      ["labels", []],
      ["assignees", []],
    ]);
    expect(container.querySelectorAll("button[aria-label]").length).toBe(10);
    await act(async () => setLanguage("en"));
    expect(container.textContent).toContain("High");
    expect(container.textContent).toContain("Imported English state");
    expect(updateIntake).toHaveBeenCalledTimes(3);
  });
});
