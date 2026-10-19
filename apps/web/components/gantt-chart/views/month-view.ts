/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { addDays } from "date-fns";
import { uniqBy } from "lodash-es";
import type { ChartDataType, EStartOfTheWeek } from "@plane/types";
import { formatDateForLocale, getCalendarDateLib, getDateCalendar } from "@plane/utils";
import { getChartDateRange } from "./helpers";
import type { IWeekBlock } from "./week-view";
import { getWeeksBetweenTwoDates } from "./week-view";

export interface IMonthBlock {
  today: boolean;
  month: number;
  days: number;
  monthData: { shortTitle: string; title: string };
  title: string;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface IMonthView {
  months: IMonthBlock[];
  weeks: IWeekBlock[];
}

const generateMonthChart = (
  chart: ChartDataType,
  side: null | "left" | "right",
  targetDate?: Date,
  weekStartsOn?: EStartOfTheWeek,
  locale = "en"
) => {
  const { startDate, endDate, state, scrollWidth } = getChartDateRange(chart, side, targetDate, weekStartsOn, locale);
  return {
    state,
    scrollWidth,
    payload: {
      months: getMonthsBetweenTwoDates(startDate, endDate, locale),
      weeks: getWeeksBetweenTwoDates(startDate, endDate, false, weekStartsOn, locale),
    },
  };
};

export const getMonthsBetweenTwoDates = (startDate: Date, endDate: Date, locale = "en"): IMonthBlock[] => {
  const months: IMonthBlock[] = [];
  const calendar = getCalendarDateLib(locale);
  const today = new Date();
  for (let date = calendar.startOfMonth(startDate); date <= endDate; date = calendar.addMonths(date, 1)) {
    const monthEnd = addDays(calendar.addMonths(date, 1), -1);
    months.push({
      year: calendar.getYear(date),
      month: calendar.getMonth(date),
      startDate: date,
      endDate: monthEnd,
      days: calendar.getDaysInMonth(date),
      monthData: {
        shortTitle: formatDateForLocale(date, getDateCalendar(locale) === "persian" ? "MMMM" : "MMM", locale),
        title: formatDateForLocale(date, "MMMM", locale),
      },
      title: formatDateForLocale(date, "MMMM yyyy", locale),
      today: today >= date && today < addDays(monthEnd, 1),
    });
  }
  return months;
};

export const monthView = {
  generateChart: generateMonthChart,
  mergeRenderPayloads: (a: IMonthView, b: IMonthView): IMonthView => ({
    months: uniqBy([...a.months, ...b.months], (month) => month.startDate.getTime()),
    weeks: uniqBy([...a.weeks, ...b.weeks], (week) => week.startDate.getTime()),
  }),
};
