/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { addDays, differenceInCalendarDays, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import type { ChartDataType, EStartOfTheWeek, IGanttBlock } from "@plane/types";
import { getCalendarDateLib, getCalendarPreferences, getDate } from "@plane/utils";
import { DEFAULT_BLOCK_WIDTH } from "../constants";

/** Week one contains the selected calendar's first day of the year. */
export const getWeekNumberByDate = (date: Date, weekStartsOn?: EStartOfTheWeek, locale = "en") => {
  const calendar = getCalendarDateLib(locale);
  const options = { weekStartsOn: getCalendarPreferences({ start_of_the_week: weekStartsOn }, locale).startOfWeek };
  const yearStart = calendar.startOfMonth(calendar.setMonth(date, 0));
  const nextYearWeek = startOfWeek(calendar.addYears(yearStart, 1), options);
  const firstWeek = date >= nextYearWeek ? nextYearWeek : startOfWeek(yearStart, options);
  return Math.floor(differenceInCalendarDays(date, firstWeek) / 7) + 1;
};

export const getNumberOfDaysBetweenTwoDates = (startDate: Date, endDate: Date) =>
  differenceInCalendarDays(startDate, endDate);

/** Only new columns are returned when extending the chart; existing dates never move. */
export const getChartDateRange = (
  chart: ChartDataType,
  side: null | "left" | "right",
  targetDate?: Date,
  weekStartsOn?: EStartOfTheWeek,
  locale = "en"
) => {
  const calendar = getCalendarDateLib(locale);
  const options = { weekStartsOn: getCalendarPreferences({ start_of_the_week: weekStartsOn }, locale).startOfWeek };
  const isQuarter = chart.key === "quarter";
  const range = Math.ceil(chart.data.approxFilterRange / (isQuarter && side ? 2 : 1));
  const anchor =
    targetDate ??
    (side === "left" ? chart.data.startDate : side === "right" ? chart.data.endDate : chart.data.currentDate);
  const firstMonth = calendar.startOfMonth(calendar.addMonths(anchor, -range));
  const lastMonth = calendar.startOfMonth(calendar.addMonths(anchor, range - (isQuarter ? 1 : 0)));
  const startDate =
    side === "right"
      ? addDays(chart.data.endDate, 1)
      : isQuarter
        ? calendar.addMonths(firstMonth, -(calendar.getMonth(firstMonth) % 3))
        : startOfWeek(firstMonth, options);
  const endDate =
    side === "left"
      ? addDays(chart.data.startDate, -1)
      : isQuarter
        ? addDays(calendar.addMonths(lastMonth, 3 - (calendar.getMonth(lastMonth) % 3)), -1)
        : startOfDay(endOfWeek(addDays(calendar.addMonths(lastMonth, 1), -1), options));

  return {
    startDate,
    endDate,
    state: {
      ...chart,
      data: {
        ...chart.data,
        startDate: side === "right" ? chart.data.startDate : startDate,
        endDate: side === "left" ? chart.data.endDate : endDate,
      },
    },
    scrollWidth: (differenceInCalendarDays(endDate, startDate) + 1) * chart.data.dayWidth,
  };
};

export const getDateFromPositionOnGantt = (position: number, chartData: ChartDataType, offsetDays = 0) =>
  addDays(chartData.data.startDate, Math.round(position / chartData.data.dayWidth) + offsetDays);

export const getItemPositionWidth = (chartData: ChartDataType, itemData: IGanttBlock) => {
  const itemStartDate = getDate(itemData.start_date);
  const itemTargetDate = getDate(itemData.target_date);
  if (!itemStartDate && !itemTargetDate) return;

  return {
    marginLeft: itemStartDate
      ? getPositionFromDate(chartData, itemStartDate, 0)
      : getPositionFromDate(chartData, itemTargetDate!, chartData.data.dayWidth - DEFAULT_BLOCK_WIDTH),
    width:
      itemStartDate && itemTargetDate
        ? (Math.abs(differenceInCalendarDays(itemTargetDate, itemStartDate)) + 1) * chartData.data.dayWidth
        : DEFAULT_BLOCK_WIDTH,
  };
};

export const getPositionFromDate = (chartData: ChartDataType, date: string | Date, offsetWidth: number) => {
  const currentDate = getDate(date);
  return currentDate
    ? differenceInCalendarDays(currentDate, chartData.data.startDate) * chartData.data.dayWidth + offsetWidth
    : 0;
};
