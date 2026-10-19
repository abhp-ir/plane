/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EStartOfTheWeek } from "@plane/types";

export const getWeekdayLabel = (day: EStartOfTheWeek, locale: string, width: "long" | "short" = "long"): string =>
  new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale === "ua" ? "uk-UA" : locale, {
    weekday: width,
    timeZone: "UTC",
  }).format(
    // 1 January 2023 is a Sunday, matching the stored weekday enum's zero.
    Date.UTC(2023, 0, 1 + day)
  );
