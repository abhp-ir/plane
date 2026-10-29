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
import { ProjectFiltersSelection } from "./root";

const platform = vi.hoisted(() => ({ isMobile: false }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => platform }));
vi.mock("./access", () => ({ FilterAccess: () => null }));
vi.mock("./created-at", () => ({ FilterCreatedDate: () => null }));
vi.mock("./lead", () => ({ FilterLead: () => null }));
vi.mock("./members", () => ({ FilterMembers: () => null }));
vi.mock("@/components/issues/issue-layouts/filters", () => ({
  FilterOption: ({ title }: { title: string }) => createElement("span", null, title),
}));

it.each([false, true])(
  "localizes filter search without losing query or stealing focus on updates, mobile=%s",
  async (isMobile) => {
    await initPromise;
    await setLanguage("fa");
    platform.isMobile = isMobile;
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div"),
      outside = document.createElement("button");
    document.body.append(outside, container);
    outside.focus();
    const root = createRoot(container),
      update = vi.fn(),
      updateDisplay = vi.fn();
    const filters = {},
      displayFilters = {};
    try {
      await act(async () =>
        root.render(
          createElement(
            TranslationProvider,
            null,
            createElement(ProjectFiltersSelection, {
              filters,
              displayFilters,
              handleFiltersUpdate: update,
              handleDisplayFiltersUpdate: updateDisplay,
            })
          )
        )
      );
      const input = container.querySelector("input")!;
      expect(input.placeholder).toBe("جست‌وجو");
      expect(input.getAttribute("aria-label")).toBe("جست‌وجو");
      expect(document.activeElement).toBe(isMobile ? outside : input);
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "کار ABC-42");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
      outside.focus();
      await act(async () => setLanguage("en"));
      expect(input.value).toBe("کار ABC-42");
      expect(input.placeholder).toBe("Search");
      expect(document.activeElement).toBe(outside);
      await act(async () => setLanguage("fa"));
      expect(input.value).toBe("کار ABC-42");
      expect(document.activeElement).toBe(outside);
      const clear = container.querySelector("button")!;
      clear.focus();
      await act(async () => clear.click());
      expect(input.value).toBe("");
      expect(document.activeElement).toBe(input);
      expect(update).not.toHaveBeenCalled();
      expect(updateDisplay).not.toHaveBeenCalled();
      expect(filters).toEqual({});
      expect(displayFilters).toEqual({});
    } finally {
      await act(async () => root.unmount());
      outside.remove();
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
