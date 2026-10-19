/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { ChartDataType, EStartOfTheWeek, IGanttBlock } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
import { DEFAULT_BLOCK_WIDTH } from "../constants";
import {
  getDateFromPositionOnGantt,
  getItemPositionWidth,
  getNumberOfDaysBetweenTwoDates,
  getPositionFromDate,
  getWeekNumberByDate,
} from "./helpers";
import { type IMonthBlock, type IMonthView, getMonthsBetweenTwoDates, monthView } from "./month-view";
import { groupMonthsToQuarters, quarterView } from "./quarter-view";
import { type IWeekBlock, getWeeksBetweenTwoDates, weekView } from "./week-view";

const date = (value: string) => new Date(`${value}T12:34:56`);
const key = (value: Date) => renderFormattedPayloadDate(value);
const chart = (view = "week", current = "2025-03-21", range = 3): ChartDataType => ({
  key: view,
  i18n_title: `common.${view}`,
  data: {
    startDate: date(current),
    endDate: date(current),
    currentDate: date(current),
    dayWidth: 20,
    approxFilterRange: range,
  },
});

describe("canonical Gantt calendar scales", () => {
  it("uses real leap/non-leap Esfand and Nowruz month boundaries, labels and widths", () => {
    const months = getMonthsBetweenTwoDates(date("2025-02-19"), date("2025-04-21"), "fa");
    expect(
      months.map((month) => [
        month.year,
        month.month,
        month.days,
        key(month.startDate),
        key(month.endDate),
        month.title,
      ])
    ).toEqual([
      [1403, 11, 30, "2025-02-19", "2025-03-20", "اسفند ۱۴۰۳"],
      [1404, 0, 31, "2025-03-21", "2025-04-20", "فروردین ۱۴۰۴"],
      [1404, 1, 31, "2025-04-21", "2025-05-21", "اردیبهشت ۱۴۰۴"],
    ]);
    const esfand = getMonthsBetweenTwoDates(date("2026-02-20"), date("2026-03-20"), "fa");
    expect(
      esfand.map((month) => [month.year, month.month, month.days, key(month.startDate), key(month.endDate)])
    ).toEqual([[1404, 11, 29, "2026-02-20", "2026-03-20"]]);
  });

  it("preserves Gregorian leap months and canonical dates for English", () => {
    const months = getMonthsBetweenTwoDates(date("2024-02-15"), date("2024-03-01"), "en");
    expect(
      months.map((month) => [
        month.year,
        month.month,
        month.days,
        key(month.startDate),
        key(month.endDate),
        month.title,
      ])
    ).toEqual([
      [2024, 1, 29, "2024-02-01", "2024-02-29", "February 2024"],
      [2024, 2, 31, "2024-03-01", "2024-03-31", "March 2024"],
    ]);
  });

  it("propagates every week start through both week and nested month scales", () => {
    for (const locale of ["fa", "en"]) {
      for (let start = 0; start < 7; start++) {
        const weekStart = start as EStartOfTheWeek;
        const weeks = getWeeksBetweenTwoDates(date("2025-03-19"), date("2025-03-23"), true, weekStart, locale);
        const month = monthView.generateChart(chart("month"), null, undefined, weekStart, locale);
        for (const week of [...weeks, ...month.payload.weeks]) {
          expect(week.startDate.getDay()).toBe(start);
          expect(week.endDate.getDay()).toBe((start + 6) % 7);
          expect(getNumberOfDaysBetweenTwoDates(week.endDate, week.startDate)).toBe(6);
        }
        expect(weeks.flatMap((week) => week.children!).map((day) => day.day)).toEqual(
          weeks.flatMap(() => Array.from({ length: 7 }, (_, index) => (start + index) % 7))
        );
      }
    }
  });

  it("defaults to Saturday for Persian while honoring explicit Sunday and Monday", () => {
    for (const [start, expected] of [
      [undefined, 6],
      [0, 0],
      [1, 1],
    ] as const) {
      const result = weekView.generateChart(chart(), null, undefined, start, "fa");
      expect(result.state.data.startDate.getDay()).toBe(expected);
      expect(result.payload[0].children?.[0].day).toBe(expected);
    }
    expect(weekView.generateChart(chart(), null).state.data.startDate.getDay()).toBe(0);
  });

  it("numbers the week containing the selected calendar's new year as week one", () => {
    expect(getWeekNumberByDate(date("2025-03-15"), 6, "fa")).toBe(1);
    expect(getWeekNumberByDate(date("2025-03-21"), 6, "fa")).toBe(1);
    expect(getWeekNumberByDate(date("2025-03-22"), 6, "fa")).toBe(2);
    expect(getWeekNumberByDate(date("2024-12-29"), 0, "en")).toBe(1);
    expect(getWeekNumberByDate(date("2025-01-04"), 0, "en")).toBe(1);
    expect(getWeekNumberByDate(date("2025-01-05"), 0, "en")).toBe(2);
  });

  it("aligns Persian quarters to Dey/Farvardin/Tir instead of Gregorian January/April", () => {
    const result = quarterView.generateChart(chart("quarter"), null, undefined, 6, "fa");
    expect([key(result.state.data.startDate), key(result.state.data.endDate)]).toEqual(["2024-12-21", "2025-06-21"]);
    const quarters = groupMonthsToQuarters(result.payload, "fa");
    expect(
      quarters.map((quarter) => [quarter.year, quarter.quarterNumber, quarter.children.map((month) => month.month)])
    ).toEqual([
      [1403, 3, [9, 10, 11]],
      [1404, 0, [0, 1, 2]],
    ]);
    expect(quarters.map((quarter) => quarter.children.reduce((total, month) => total + month.days, 0))).toEqual([
      90, 93,
    ]);
    expect(result.scrollWidth).toBe(183 * 20);
  });

  it("retains Gregorian quarter boundaries for English", () => {
    const result = quarterView.generateChart(chart("quarter", "2025-04-10"), null, undefined, 1, "en");
    expect([key(result.state.data.startDate), key(result.state.data.endDate)]).toEqual(["2025-01-01", "2025-06-30"]);
  });

  it("expands all scales contiguously with exact new widths and no duplicate weeks/months", () => {
    for (const locale of ["fa", "en"]) {
      for (const [view, helper] of Object.entries({ week: weekView, month: monthView, quarter: quarterView })) {
        const initial = helper.generateChart(chart(view), null, undefined, 6, locale);
        const left = helper.generateChart(initial.state, "left", undefined, 6, locale);
        const right = helper.generateChart(left.state, "right", undefined, 6, locale);
        expect(left.scrollWidth).toBe(
          getNumberOfDaysBetweenTwoDates(initial.state.data.startDate, left.state.data.startDate) * 20
        );
        expect(right.scrollWidth).toBe(
          getNumberOfDaysBetweenTwoDates(right.state.data.endDate, left.state.data.endDate) * 20
        );
        const fullWidth = initial.scrollWidth + left.scrollWidth + right.scrollWidth;
        expect(fullWidth).toBe(
          (getNumberOfDaysBetweenTwoDates(right.state.data.endDate, right.state.data.startDate) + 1) * 20
        );
        if (view === "month") {
          const merged = monthView.mergeRenderPayloads(
            monthView.mergeRenderPayloads(left.payload as IMonthView, initial.payload as IMonthView),
            right.payload as IMonthView
          );
          expect(merged.weeks.length * 7 * 20).toBe(fullWidth);
          expect(new Set(merged.months.map((month) => key(month.startDate))).size).toBe(merged.months.length);
        } else if (view === "week") {
          const merged = weekView.mergeRenderPayloads(
            weekView.mergeRenderPayloads(left.payload as IWeekBlock[], initial.payload as IWeekBlock[]),
            right.payload as IWeekBlock[]
          );
          expect(merged.length * 7 * 20).toBe(fullWidth);
          expect(new Set(merged.map((week) => key(week.startDate))).size).toBe(merged.length);
        } else {
          const merged = quarterView.mergeRenderPayloads(
            quarterView.mergeRenderPayloads(left.payload as IMonthBlock[], initial.payload as IMonthBlock[]),
            right.payload as IMonthBlock[]
          );
          expect(merged.reduce((total, month) => total + month.days, 0) * 20).toBe(fullWidth);
          expect(new Set(merged.map((month) => key(month.startDate))).size).toBe(merged.length);
        }
      }
    }
  });
});

describe("canonical Gantt pixel mapping", () => {
  it("keeps inclusive bar widths across spring/fall DST without mutating Date inputs", () => {
    for (const [start, end] of [
      ["2025-03-08", "2025-03-10"],
      ["2025-11-01", "2025-11-03"],
    ]) {
      const data = chart("week", start);
      const before = data.data.startDate.getTime();
      const block = { start_date: start, target_date: end } as IGanttBlock;
      expect(getItemPositionWidth(data, block)).toEqual({ marginLeft: 0, width: 60 });
      expect(data.data.startDate.getTime()).toBe(before);
    }
  });

  it("retains target-only offsets at chart origin and signed date/pixel round trips", () => {
    const data = chart();
    const original = date("2025-03-20");
    const before = original.getTime();
    expect(getPositionFromDate(data, data.data.startDate, 13)).toBe(13);
    expect(getItemPositionWidth(data, { target_date: "2025-03-21" } as IGanttBlock)).toEqual({
      marginLeft: 20 - DEFAULT_BLOCK_WIDTH,
      width: DEFAULT_BLOCK_WIDTH,
    });
    expect(getPositionFromDate(data, original, 0)).toBe(-20);
    expect(key(getDateFromPositionOnGantt(-20, data))).toBe("2025-03-20");
    expect(key(getDateFromPositionOnGantt(40, data, -1))).toBe("2025-03-22");
    expect(original.getTime()).toBe(before);
  });
});
