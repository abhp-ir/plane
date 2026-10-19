// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
import { WorkItemPreviewCardDate } from "@/components/issues/preview-card/date";
import { ReadonlyDate } from "./date";

it("updates read-only, preview and merged dates on a mounted calendar-language switch", async () => {
  await initPromise;
  await setLanguage("en");
  const container = document.createElement("div");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(ReadonlyDate, { value: "2025-03-20", formatToken: "dd/MM/yyyy" }),
          createElement(WorkItemPreviewCardDate, {
            startDate: "2025-03-20",
            targetDate: "2025-03-21",
            stateGroup: "unstarted",
          }),
          createElement(MergedDateDisplay, { startDate: "2025-03-20", endDate: "2025-03-21" })
        )
      )
    );
    const english = container.textContent;
    expect(english).toContain("20/03/2025");
    expect(english).toContain("Mar 20 - 21, 2025");
    await act(async () => setLanguage("fa"));
    expect(container.textContent).toContain("۳۰/۱۲/۱۴۰۳");
    expect(container.textContent).toContain("اسف ۳۰, ۱۴۰۳ - فرو ۰۱, ۱۴۰۴");
    expect(container.textContent).not.toContain("2025");
    await act(async () => setLanguage("en"));
    expect(container.textContent).toBe(english);
  } finally {
    await act(async () => root.unmount());
    await setLanguage("en");
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
