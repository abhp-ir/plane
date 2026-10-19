/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observable, runInAction } from "mobx";
import { expect, it } from "vitest";
import { CalendarStore } from "./issue_calendar_view.store";
import type { IIssueRootStore } from "./root.store";

const localDate = (value: string) => new Date(`${value}T00:00:00`);
const setup = () => {
  const profile = observable({ start_of_the_week: 6 });
  const root = { rootStore: { user: { userProfile: { data: profile } } } } as unknown as IIssueRootStore;
  return { profile, store: new CalendarStore(root) };
};

it("keeps existing English month/week bounds and independent navigation anchors", () => {
  const { store } = setup();
  store.updateCalendarFilters({ activeMonthDate: localDate("2025-03-20") });
  store.updateCalendarFilters({ activeWeekDate: localDate("2026-01-01") });
  expect(store.getStartAndEndDate("month")).toEqual({ startDate: "2025-03-01", endDate: "2025-04-04" });
  expect(store.getStartAndEndDate("week")).toEqual({ startDate: "2025-12-27", endDate: "2026-01-02" });
});

it("couples Jalali month/week API intervals to the actual grid through locale and week-start changes", () => {
  const { store, profile } = setup();
  const anchor = localDate("2025-03-20");
  store.updateCalendarFilters({ activeMonthDate: anchor, activeWeekDate: anchor });
  expect(store.getStartAndEndDate("month", "fa")).toEqual({ startDate: "2025-02-15", endDate: "2025-03-21" });
  expect(store.getStartAndEndDate("week", "fa")).toEqual({ startDate: "2025-03-15", endDate: "2025-03-21" });
  runInAction(() => {
    profile.start_of_the_week = 1;
  });
  expect(store.getStartAndEndDate("month", "fa")).toEqual({ startDate: "2025-02-17", endDate: "2025-03-23" });
  expect(store.getStartAndEndDate("week", "fa")).toEqual({ startDate: "2025-03-17", endDate: "2025-03-23" });
  expect(store.getStartAndEndDate("month", "en")).toEqual({ startDate: "2025-02-24", endDate: "2025-04-06" });
  expect(store.getStartAndEndDate("month", "fa")).toEqual({ startDate: "2025-02-17", endDate: "2025-03-23" });
  expect(store.calendarFilters.activeMonthDate).toBe(anchor);
  expect(store.calendarFilters.activeWeekDate).toBe(anchor);
});

it("fetches every visible Jalali day for all seven supported week starts", () => {
  const { store, profile } = setup();
  store.updateCalendarFilters({ activeMonthDate: localDate("2025-03-20"), activeWeekDate: localDate("2025-03-21") });
  const first = ["2025-02-16", "2025-02-17", "2025-02-18", "2025-02-19", "2025-02-13", "2025-02-14", "2025-02-15"];
  const last = ["2025-03-22", "2025-03-23", "2025-03-24", "2025-03-25", "2025-03-26", "2025-03-20", "2025-03-21"];
  for (let start = 0; start < 7; start++) {
    runInAction(() => {
      profile.start_of_the_week = start;
    });
    expect(store.getStartAndEndDate("month", "fa")).toEqual({ startDate: first[start], endDate: last[start] });
    const week = Object.keys(store.allDaysOfActiveWeek("fa")!);
    expect(week).toContain("2025-03-21");
    expect(week).toHaveLength(7);
    expect(store.getStartAndEndDate("week", "fa")).toEqual({ startDate: week[0], endDate: week[6] });
  }
});
