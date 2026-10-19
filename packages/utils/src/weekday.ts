/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EStartOfTheWeek } from "@plane/types";
import { getDateCalendar } from "./localized-datetime";

/** Personal presentation preferences; no scheduling/business-day rules are inferred from them. */
export const getCalendarPreferences = (
  profile:
    | {
        start_of_the_week?: EStartOfTheWeek;
        working_days?: readonly EStartOfTheWeek[] | null;
      }
    | null
    | undefined,
  locale: string = "en"
): { startOfWeek: EStartOfTheWeek; workingDays: readonly EStartOfTheWeek[] } => {
  const persian = getDateCalendar(locale) === "persian";
  return {
    startOfWeek: profile?.start_of_the_week ?? (persian ? 6 : 0),
    workingDays: profile?.working_days ?? (persian ? [6, 0, 1, 2, 3] : [1, 2, 3, 4, 5]),
  };
};

export const getWeekdayLabel = (
  day: EStartOfTheWeek,
  locale: string,
  width: "long" | "short" | "narrow" = "long"
): string =>
  new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale === "ua" ? "uk-UA" : locale, {
    weekday: width,
    timeZone: "UTC",
  }).format(
    // 1 January 2023 is a Sunday, matching the stored weekday enum's zero.
    Date.UTC(2023, 0, 1 + day)
  );
