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
import { useTimeZoneConverter } from "./use-timezone-converter";

const { user } = vi.hoisted(() => ({ user: { user_timezone: "UTC" } }));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: user }) }));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({ getProjectById: () => ({ timezone: "UTC" }) }) }));

it.each([
  ["UTC", "Mar 21, 2025", "فرو ۰۱, ۱۴۰۴"],
  ["Asia/Tehran", "Mar 21, 2025", "فرو ۰۱, ۱۴۰۴"],
  ["America/Los_Angeles", "Mar 20, 2025", "اسف ۳۰, ۱۴۰۳"],
] as const)("keeps %s while updating a mounted date callback's calendar", async (zone, english, persian) => {
  await initPromise;
  await setLanguage("en");
  const container = document.createElement("div");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(container);
  let converter: ReturnType<typeof useTimeZoneConverter> | undefined;
  function Consumer() {
    converter = useTimeZoneConverter("synthetic");
    return null;
  }
  try {
    user.user_timezone = zone;
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(Consumer))));
    expect(converter!.renderFormattedDateInUserTimezone("2025-03-21T01:00:00Z")).toBe(english);
    await act(async () => setLanguage("fa"));
    expect(converter!.renderFormattedDateInUserTimezone("2025-03-21T01:00:00Z")).toBe(persian);
    expect(user.user_timezone).toBe(zone);
    await act(async () => setLanguage("en"));
    expect(converter!.renderFormattedDateInUserTimezone("2025-03-21T01:00:00Z")).toBe(english);
  } finally {
    await act(async () => root.unmount());
    await setLanguage("en");
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    user.user_timezone = "UTC";
  }
});
