/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLanguage } from "@plane/i18n";
import type { DayPickerLocale } from "react-day-picker/locale";
import {
  bg,
  cs,
  de,
  enUS,
  es,
  faIR,
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

const PERSIAN_MONTH_FORMATTERS = {
  narrow: new Intl.DateTimeFormat("fa-IR", { calendar: "gregory", month: "narrow" }),
  abbreviated: new Intl.DateTimeFormat("fa-IR", { calendar: "gregory", month: "short" }),
  wide: new Intl.DateTimeFormat("fa-IR", { calendar: "gregory", month: "long" }),
};

const DATE_LOCALES = {
  en: enUS,
  fa: {
    ...faIR,
    localize: {
      ...faIR.localize,
      // date-fns uses non-Iranian month names (e.g. جون); Intl supplies Iranian Gregorian names.
      month: (month, options) =>
        PERSIAN_MONTH_FORMATTERS[
          options?.width === "narrow" ? "narrow" : options?.width === "abbreviated" ? "abbreviated" : "wide"
        ].format(new Date(2000, month, 1)),
    },
  },
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

export const getDateSelectOptions = (
  language: TLanguage
): { locale: DayPickerLocale; numerals: "arabext" | "latn" } => ({
  locale: DATE_LOCALES[language],
  numerals: language === "fa" ? "arabext" : "latn",
});

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
