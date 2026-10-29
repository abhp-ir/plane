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
import { DataTable } from "./data-table";

vi.mock("@makeplane/propel/components/table", () => ({
  Table: ({ children }: { children: ReactNode }) => createElement("table", null, children),
  TableBody: ({ children }: { children: ReactNode }) => createElement("tbody", null, children),
  TableHeader: ({ children }: { children: ReactNode }) => createElement("thead", null, children),
  TableRow: ({ children }: { children: ReactNode }) => createElement("tr", null, children),
}));
vi.mock("@makeplane/propel/elements/table", () => ({
  TableCell: ({ children, colSpan }: { children: ReactNode; colSpan?: number }) =>
    createElement("td", { colSpan }, children),
  TableHead: ({ children, colSpan }: { children: ReactNode; colSpan?: number }) =>
    createElement("th", { colSpan }, children),
}));
vi.mock("@plane/blocks/empty-state", () => ({ EmptyStateCompact: () => null }));

it("keeps search controlled, preserves user text across locale changes and restores focus when closing", async () => {
  await initPromise;
  await setLanguage("fa");
  const source = [{ name: "کار ABC-42" }, { name: "Unchanged imported title" }];
  const before = structuredClone(source);
  const errors = vi.spyOn(console, "error");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(DataTable, {
            data: source,
            columns: [{ accessorKey: "name", header: "Imported column" }],
            searchPlaceholder: "تعداد (۲)",
          })
        )
      )
    );
    await act(async () => container.querySelector("button")!.click());
    const input = container.querySelector("input")!;
    expect(document.activeElement).toBe(input);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "ABC-42");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe("ABC-42");
    await act(async () => setLanguage("en"));
    expect(input.value).toBe("ABC-42");
    expect(input.getAttribute("aria-label")).toBe("Search");
    await act(async () => setLanguage("fa"));
    expect(input.getAttribute("aria-label")).toBe("جست‌وجو");
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(container.querySelector("button"));
    await act(async () => container.querySelector("button")!.click());
    const close = container.querySelector("button")!;
    close.focus();
    await act(async () => close.click());
    expect(document.activeElement).toBe(container.querySelector("button"));
    expect(source).toEqual(before);
    expect(errors.mock.calls.filter((call) => /uncontrolled|controlled input/.test(String(call[0])))).toEqual([]);
  } finally {
    await act(async () => root.unmount());
    errors.mockRestore();
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
