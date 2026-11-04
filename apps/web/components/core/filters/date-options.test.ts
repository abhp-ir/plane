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
import { FilterCreatedDate } from "@/components/project/dropdowns/filters/created-at";
vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});

it("searches Persian dates and Custom aliases while retaining canonical selection and mounted locale state", async () => {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const handleUpdate = vi.fn();
  const render = (searchQuery: string) =>
    root.render(
      createElement(
        TranslationProvider,
        null,
        createElement(FilterCreatedDate, { appliedFilters: ["last_30_days;custom;custom"], handleUpdate, searchQuery })
      )
    );
  const button = (label: string) =>
    [...container.querySelectorAll("button")].find((node) => node.textContent === label);
  try {
    await act(async () => render("۳۰"));
    expect(container.textContent).toContain("تاریخ ایجاد (۱)");
    const selected = button("۳۰ روز گذشته")!;
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    await act(async () => selected.click());
    expect(handleUpdate).toHaveBeenCalledExactlyOnceWith("last_30_days;custom;custom");
    await act(async () => render("سفارشی"));
    expect(button("سفارشی")).toBeDefined();
    expect(container.textContent).not.toContain("مورد منطبقی پیدا نشد");
    await act(async () => render("Custom"));
    expect(button("سفارشی")).toBeDefined();
    await act(async () => setLanguage("en"));
    expect(button("Custom")).toBeDefined();
    await act(async () => render("Last 30 days"));
    expect(button("Last 30 days")?.getAttribute("aria-pressed")).toBe("true");
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
