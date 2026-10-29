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
import { CyclesViewHeader } from "./cycles-view-header";

const search = vi.hoisted(() => ({ query: "" }));
vi.mock("@/hooks/store/use-cycle-filter", () => ({
  useCycleFilter: () => ({
    searchQuery: search.query,
    currentProjectFilters: {},
    updateFilters: vi.fn(),
    updateSearchQuery: vi.fn(),
  }),
}));
vi.mock("./dropdowns", () => ({ CycleFiltersSelection: () => null }));
vi.mock("@/components/issues/issue-layouts/filters", () => ({ FiltersDropdown: () => null }));

it.each(["", "نام ABC-42"])(
  "focuses newly opened search and preserves initial saved query focus: %s",
  async (query) => {
    await initPromise;
    await setLanguage("fa");
    search.query = query;
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div"),
      outside = document.createElement("button");
    document.body.append(outside, container);
    outside.focus();
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          createElement(TranslationProvider, null, createElement(CyclesViewHeader, { projectId: "project-id" }))
        )
      );
      if (query) {
        expect(document.activeElement).toBe(outside);
        expect(container.querySelector("input")!.value).toBe(query);
        await act(async () => setLanguage("en"));
        expect(container.querySelector("input")!.value).toBe(query);
        expect(document.activeElement).toBe(outside);
      } else {
        await act(async () => container.querySelector("button")!.click());
        const input = container.querySelector("input")!;
        expect(input.placeholder).toBe("جست‌وجو");
        expect(document.activeElement).toBe(input);
        await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
        expect(document.activeElement).toBe(container.querySelector("button"));
      }
    } finally {
      await act(async () => root.unmount());
      outside.remove();
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
