/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isValid } from "date-fns";

/** Localized UI timestamps keep the Gregorian calendar and 24-hour time used by stored dates. */
export const renderLocalizedDateTime = (date: string | Date, locale: string): { date: string; time: string } => {
  const parsedDate = new Date(date);
  if (!isValid(parsedDate)) return { date: "", time: "" };
  const language = locale === "ua" ? "uk-UA" : locale;
  return {
    date: new Intl.DateTimeFormat(language, { calendar: "gregory", dateStyle: "medium" }).format(parsedDate),
    time: new Intl.DateTimeFormat(language, { hourCycle: "h23", timeStyle: "short" }).format(parsedDate),
  };
};
