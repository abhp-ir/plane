/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { addDays, isSameDay, startOfDay, startOfWeek } from "date-fns";
import type { ChartDataType, EStartOfTheWeek } from "@plane/types";
import { formatDateForLocale, getCalendarDateLib, getCalendarPreferences, getDateCalendar } from "@plane/utils";
import { getChartDateRange, getWeekNumberByDate } from "./helpers";

export interface IDayBlock {
  date: Date;
  day: number;
  today: boolean;
}

export interface IWeekBlock {
  children?: IDayBlock[];
  weekNumber: number;
  title: string;
  startDate: Date;
  endDate: Date;
  today: boolean;
}

const generateWeekChart = (
  chart: ChartDataType,
  side: null | "left" | "right",
  targetDate?: Date,
  weekStartsOn?: EStartOfTheWeek,
  locale = "en"
) => {
  const { startDate, endDate, state, scrollWidth } = getChartDateRange(chart, side, targetDate, weekStartsOn, locale);
  return { state, scrollWidth, payload: getWeeksBetweenTwoDates(startDate, endDate, true, weekStartsOn, locale) };
};

export const getWeeksBetweenTwoDates = (
  startDate: Date,
  endDate: Date,
  shouldPopulateDaysForWeek = true,
  weekStartsOn?: EStartOfTheWeek,
  locale = "en"
): IWeekBlock[] => {
  const weeks: IWeekBlock[] = [];
  const calendar = getCalendarDateLib(locale);
  const options = { weekStartsOn: getCalendarPreferences({ start_of_the_week: weekStartsOn }, locale).startOfWeek };
  const today = startOfDay(new Date());
  const monthFormat = getDateCalendar(locale) === "persian" ? "MMMM yyyy" : "MMM yyyy";
  for (
    let currentDate = startOfWeek(startDate, options);
    currentDate <= endDate;
    currentDate = addDays(currentDate, 7)
  ) {
    const weekEnd = addDays(currentDate, 6);
    const sameMonth =
      calendar.getMonth(currentDate) === calendar.getMonth(weekEnd) &&
      calendar.getYear(currentDate) === calendar.getYear(weekEnd);
    weeks.push({
      children: shouldPopulateDaysForWeek
        ? Array.from({ length: 7 }, (_, index) => {
            const date = addDays(currentDate, index);
            return { date, day: date.getDay(), today: isSameDay(date, today) };
          })
        : undefined,
      weekNumber: getWeekNumberByDate(currentDate, weekStartsOn, locale),
      title: sameMonth
        ? formatDateForLocale(currentDate, monthFormat, locale)
        : `${formatDateForLocale(currentDate, monthFormat, locale)} – ${formatDateForLocale(weekEnd, monthFormat, locale)}`,
      startDate: currentDate,
      endDate: weekEnd,
      today: today >= currentDate && today <= weekEnd,
    });
  }
  return weeks;
};

export const weekView = {
  generateChart: generateWeekChart,
  mergeRenderPayloads: (a: IWeekBlock[], b: IWeekBlock[]) => [...a, ...b],
};
