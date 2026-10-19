/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observable, action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import type { ICalendarWeek } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
import { generateCalendarData, getCalendarDateLib, renderFormattedPayloadDate } from "@plane/utils";
// types
import type { IIssueRootStore } from "./root.store";

export interface ICalendarStore {
  calendarFilters: {
    activeMonthDate: Date;
    activeWeekDate: Date;
  };
  updateCalendarFilters: (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => void;
  allWeeksOfActiveMonth: (locale?: string) => Record<string, ICalendarWeek>;
  allDaysOfActiveWeek: (locale?: string) => ICalendarWeek | undefined;
  getStartAndEndDate: (layout: "week" | "month", locale?: string) => { startDate: string; endDate: string } | undefined;
}

export class CalendarStore implements ICalendarStore {
  calendarFilters = {
    activeMonthDate: new Date(),
    activeWeekDate: new Date(),
  };
  rootStore: IIssueRootStore;

  constructor(_rootStore: IIssueRootStore) {
    this.rootStore = _rootStore;
    makeObservable(this, {
      calendarFilters: observable.ref,
      updateCalendarFilters: action,
    });
  }

  // Derive from the caller's current locale, so a mounted language switch cannot reuse the other calendar's cache.
  private weeksForDate = computedFn((date: Date, locale: string) => {
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const calendar = getCalendarDateLib(locale);
    return generateCalendarData(null, date, startOfWeek, locale)[`y-${calendar.getYear(date)}`][
      `m-${calendar.getMonth(date)}`
    ];
  });

  allWeeksOfActiveMonth = (locale: string = "en") => this.weeksForDate(this.calendarFilters.activeMonthDate, locale);

  allDaysOfActiveWeek = computedFn((locale: string = "en") => {
    const { activeWeekDate } = this.calendarFilters;
    const day = renderFormattedPayloadDate(activeWeekDate);
    return Object.values(this.weeksForDate(activeWeekDate, locale)).find((week) => day && week[day]);
  });

  getStartAndEndDate = computedFn((layout: "week" | "month", locale: string = "en") => {
    const weeks =
      layout === "month" ? Object.values(this.allWeeksOfActiveMonth(locale)) : [this.allDaysOfActiveWeek(locale)];
    const dates = weeks.flatMap((week) => (week ? Object.keys(week) : []));
    if (!dates.length) return undefined;
    return { startDate: dates[0], endDate: dates[dates.length - 1] };
  });

  updateCalendarFilters: ICalendarStore["updateCalendarFilters"] = (filters) => {
    this.calendarFilters = { ...this.calendarFilters, ...filters };
  };
}
