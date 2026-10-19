/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isValid } from "date-fns";

/** Calendar presentation follows language; storage, timezone and Date values stay canonical. */
export const getDateCalendar = (locale: string): "persian" | "gregory" =>
  locale.split("-")[0].toLowerCase() === "fa" ? "persian" : "gregory";

/** Localized UI timestamps retain the existing local timezone and 24-hour time. */
export const renderLocalizedDateTime = (date: string | Date, locale: string): { date: string; time: string } => {
  const parsedDate = new Date(date);
  if (!isValid(parsedDate)) return { date: "", time: "" };
  const language = locale === "ua" ? "uk-UA" : locale;
  return {
    date: new Intl.DateTimeFormat(language, { calendar: getDateCalendar(locale), dateStyle: "medium" }).format(
      parsedDate
    ),
    time: new Intl.DateTimeFormat(language, { hourCycle: "h23", timeStyle: "short" }).format(parsedDate),
  };
};
