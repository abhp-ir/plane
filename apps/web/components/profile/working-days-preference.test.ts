/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { WorkingDaysPreference } from "./working-days-preference";

vi.mock("@/hooks/store/user", () => ({
  useUserProfile: () => ({
    data: { start_of_the_week: 6, working_days: [6, 0, 1, 2, 3] },
    updateUserProfile: vi.fn(),
  }),
}));

it("uses the Ukrainian locale alias for the selected weekday list as well as individual weekdays", async () => {
  await initPromise;
  await setLanguage("ua");
  try {
    const html = renderToStaticMarkup(createElement(TranslationProvider, null, createElement(WorkingDaysPreference)));
    expect(html).toContain("субота, неділя, понеділок, вівторок і середа");
  } finally {
    await setLanguage("en");
  }
});
