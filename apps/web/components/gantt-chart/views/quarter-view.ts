/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChartDataType, EStartOfTheWeek } from "@plane/types";
import { getCalendarDateLib } from "@plane/utils";
import { getChartDateRange } from "./helpers";
import type { IMonthBlock } from "./month-view";
import { getMonthsBetweenTwoDates } from "./month-view";

export interface IQuarterMonthBlock {
  children: IMonthBlock[];
  quarterNumber: number;
  year: number;
  today: boolean;
}

const generateQuarterChart = (
  chart: ChartDataType,
  side: null | "left" | "right",
  targetDate?: Date,
  weekStartsOn?: EStartOfTheWeek,
  locale = "en"
) => {
  const { startDate, endDate, state, scrollWidth } = getChartDateRange(chart, side, targetDate, weekStartsOn, locale);
  return { state, scrollWidth, payload: getMonthsBetweenTwoDates(startDate, endDate, locale) };
};

export const groupMonthsToQuarters = (monthBlocks: IMonthBlock[], locale = "en"): IQuarterMonthBlock[] => {
  const quarters: Record<string, IQuarterMonthBlock> = {};
  const calendar = getCalendarDateLib(locale);
  const today = new Date();
  for (const month of monthBlocks) {
    const quarterNumber = Math.floor(month.month / 3);
    const key = `${month.year}-${quarterNumber}`;
    quarters[key] ??= {
      children: [],
      quarterNumber,
      year: month.year,
      today: calendar.getYear(today) === month.year && Math.floor(calendar.getMonth(today) / 3) === quarterNumber,
    };
    quarters[key].children.push(month);
  }
  return Object.values(quarters);
};

export const quarterView = {
  generateChart: generateQuarterChart,
  mergeRenderPayloads: (a: IMonthBlock[], b: IMonthBlock[]) => [...a, ...b],
};
