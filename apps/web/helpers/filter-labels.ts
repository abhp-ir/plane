/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTranslationStore } from "@plane/i18n";
import { capitalizeFirstLetter, renderFormattedDate } from "@plane/utils";

type DateOption = { name: string; value: string };
type Translate = TTranslationStore["t"];
const intlLocale = (locale: string) => (locale === "ua" ? "uk-UA" : locale);

export const formatFilterCount = (count: number, locale: string) =>
  new Intl.NumberFormat(intlLocale(locale)).format(count);

export function getDateFilterOptionLabel(option: DateOption, locale: string, t: Translate): string {
  if (locale === "en") return option.name;
  const relative = /^([12])_(weeks|months);(before|after);fromnow$/.exec(option.value);
  if (relative) {
    const count = Number(relative[1]) * (relative[3] === "before" ? -1 : 1);
    return new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "always" }).format(
      count,
      relative[2] === "weeks" ? "week" : "month"
    );
  }
  const value = option.value.split(";")[0];
  if (value === "today" || value === "yesterday") {
    return new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" }).format(
      value === "today" ? 0 : -1,
      "day"
    );
  }
  if (value === "last_7_days" || value === "last_30_days") {
    return t("date_filters.last_days", { count: value === "last_7_days" ? 7 : 30 });
  }
  return option.name;
}

export function getAppliedDateFilterLabel(
  value: string,
  options: readonly DateOption[],
  locale: string,
  t: Translate
): string {
  const option = options.find((candidate) => candidate.value === value);
  if (option) return getDateFilterOptionLabel(option, locale, t);
  const parts = value.split(";");
  if (parts.length !== 2) return "";
  const [date, relation] = parts;
  const formatted = renderFormattedDate(date, undefined, locale);
  if (relation === "before" || relation === "after") return t(`date_filters.${relation}_date`, { date: formatted });
  return `${capitalizeFirstLetter(relation)} ${formatted}`;
}
