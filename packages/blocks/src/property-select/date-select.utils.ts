/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLanguage } from "@plane/i18n";
import { getDateCalendar } from "@plane/utils";
import { faIR, getDateLib } from "@daypicker/persian";
import type { DayPickerProps } from "react-day-picker";
import type { DayPickerLocale } from "react-day-picker/locale";
import {
  bg,
  cs,
  de,
  enUS,
  es,
  fr,
  id,
  it,
  ja,
  ka,
  ko,
  nl,
  pl,
  ptBR,
  ro,
  ru,
  sk,
  tr,
  uk,
  vi,
  zhCN,
  zhTW,
} from "react-day-picker/locale";

const DATE_LOCALES = {
  en: enUS,
  fa: faIR,
  fr,
  es,
  ja,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ru,
  it,
  cs,
  sk,
  de,
  ua: uk,
  pl,
  ko,
  "pt-BR": ptBR,
  id,
  ro,
  "vi-VN": vi,
  "tr-TR": tr,
  "ka-ge": ka,
  nl,
  bg,
} satisfies Record<TLanguage, DayPickerLocale>;

/** DayPicker focuses its selected day inside the open popover when its calendar system changes. */
export const getDateSelectOptions = (
  language: TLanguage
): { locale: DayPickerLocale; numerals: "arabext" | "latn"; dateLib?: DayPickerProps["dateLib"]; autoFocus: true } => {
  const locale = DATE_LOCALES[language];
  if (getDateCalendar(language) === "persian") {
    // Keep Propel's DayPicker/Nav provider; raw overrides honor its week-start and formatting options.
    return { locale, numerals: "arabext", dateLib: getDateLib().overrides, autoFocus: true };
  }
  return { locale, numerals: "latn", autoFocus: true };
};

/** The default trigger label format — a short, unambiguous day. Overridden by `formatToken`. */
export const DEFAULT_DATE_FORMAT_TOKEN = "MMM dd, yyyy";

/**
 * Turns a `minDate` / `maxDate` pair into propel `Calendar` day matchers. Both bounds are
 * inclusive, so they become "before min" / "after max" exclusions rather than the bounds
 * themselves. Typed structurally — react-day-picker's `Matcher` reaches this package only through
 * propel, so it is not imported here.
 */
export function buildDisabledMatchers(
  minDate?: Date,
  maxDate?: Date
): ({ before: Date } | { after: Date })[] | undefined {
  if (!minDate && !maxDate) return undefined;
  const matchers: ({ before: Date } | { after: Date })[] = [];
  if (minDate) matchers.push({ before: minDate });
  if (maxDate) matchers.push({ after: maxDate });
  return matchers;
}
