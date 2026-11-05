// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cloneElement, createElement, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { MemberListFiltersDropdown as MembersFilter } from "./dropdowns/filters/member-list";
import { MemberHeaderColumn } from "./member-header-column";

vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
vi.mock("@makeplane/propel/components/menu", () => ({
  Menu: ({ children }: { children: ReactNode }) => children,
  MenuContent: ({ children }: { children: ReactNode }) => children,
  MenuGroup: ({ children }: { children: ReactNode }) => children,
  MenuTrigger: ({
    children,
    render,
    tabIndex,
  }: {
    children?: ReactNode;
    render?: ReactElement<{ tabIndex?: number }>;
    tabIndex?: number;
  }) => (render ? cloneElement(render, { tabIndex }, children) : (children ?? null)),
  MenuLabel: ({ children, meta }: { children: ReactNode; meta?: string }) =>
    createElement("div", null, children, createElement("output", null, meta)),
  MenuItem: ({ label, onClick, selected }: { label: string; onClick: () => void; selected?: boolean }) =>
    createElement("button", { type: "button", onClick, "aria-pressed": selected }, label),
  MenuCheckboxItem: ({
    label,
    checked,
    onCheckedChange,
  }: {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) =>
    createElement(
      "label",
      null,
      createElement("input", {
        type: "checkbox",
        checked,
        onChange: (event: ChangeEvent<HTMLInputElement>) => onCheckedChange(event.currentTarget.checked),
      }),
      label
    ),
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
    await setLanguage("en");
  }
}

it.each([
  ["role", "role", "-role", ["مهمان ← مدیر", "مدیر ← مهمان"], ["Guest → Admin", "Admin → Guest"]],
  ["joining_date", "joining_date", "-joining_date", ["قدیمی ← جدید", "جدید ← قدیمی"], ["Old → New", "New → Old"]],
  ["full_name", "full_name", "-full_name", ["صعودی", "نزولی"], ["A → Z", "Z → A"]],
] as const)("switches mounted %s sorting labels without changing order values", async (property, asc, desc, fa, en) => {
  await mounted(async (container, render) => {
    const update = vi.fn();
    const filters = { order_by: asc };
    Object.freeze(filters);
    await render(
      createElement(MemberHeaderColumn, {
        property,
        displayFilters: filters,
        handleDisplayFilterUpdate: update,
      })
    );
    const checkLocale = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      const buttons = [...container.querySelectorAll("button")];
      expect(buttons[0].tabIndex).toBe(0);
      const labels = buttons.slice(1).map((button) => button.textContent);
      expect(labels).toEqual([...(locale === "fa" ? fa : en), locale === "fa" ? "پاک کردن مرتب‌سازی" : "Clear sorting"]);
    };
    await checkLocale("fa");
    await checkLocale("en");
    await checkLocale("fa");
    expect(update).not.toHaveBeenCalled();
    await act(async () =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].slice(1).forEach((button) => button.click())
    );
    expect(update.mock.calls).toEqual([[{ order_by: asc }], [{ order_by: desc }], [{ order_by: undefined }]]);
    expect(filters).toEqual({ order_by: asc });
  });
});

it.each(["workspace", "project"] as const)("switches mounted %s role filter labels and values", async (memberType) => {
  await mounted(async (container, render) => {
    const values = ["20", "15", "5", ...(memberType === "workspace" ? ["suspended"] : [])];
    const applied = [...values];
    Object.freeze(applied);
    const update = vi.fn();
    await render(createElement(MembersFilter, { memberType, appliedFilters: applied, handleUpdate: update }));
    const checkLocale = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      const labels = locale === "fa" ? ["مدیر", "عضو", "مهمان"] : ["Admin", "Member", "Guest"];
      if (memberType === "workspace") labels.push(locale === "fa" ? "تعلیق‌شده" : "Suspended");
      expect([...container.querySelectorAll("label")].map((label) => label.textContent)).toEqual(labels);
      expect(container.textContent).toContain(locale === "fa" ? "نقش‌ها" : "Roles");
      expect(container.querySelector("output")?.textContent).toBe(
        locale === "fa" ? (memberType === "workspace" ? "۴" : "۳") : String(values.length)
      );
      expect([...container.querySelectorAll("input")].every((input) => input.checked)).toBe(true);
    };
    await checkLocale("fa");
    await checkLocale("en");
    await checkLocale("fa");
    expect(update).not.toHaveBeenCalled();
    await act(async () =>
      container.querySelectorAll<HTMLInputElement>("input").forEach((checkbox) => checkbox.click())
    );
    expect(update.mock.calls).toEqual(values.map((value) => [value]));
    expect(applied).toEqual(values);
  });
});
