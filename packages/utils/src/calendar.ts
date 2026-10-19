/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  addDays,
  addMonths,
  addYears,
  getDate,
  getDaysInMonth,
  getMonth,
  getYear,
  setMonth,
  startOfMonth,
} from "date-fns";
import {
  addMonths as addJalaliMonths,
  addYears as addJalaliYears,
  getDate as getJalaliDate,
  getDaysInMonth as getJalaliDaysInMonth,
  getMonth as getJalaliMonth,
  getYear as getJalaliYear,
  setMonth as setJalaliMonth,
  startOfMonth as startOfJalaliMonth,
} from "date-fns-jalali";
// plane imports
import type { ICalendarDate, ICalendarPayload } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
// local imports
import { getWeekNumberOfDate, renderFormattedPayloadDate } from "./datetime";
import { getDateCalendar } from "./localized-datetime";

/** Calendar arithmetic changes presentation boundaries, never the underlying Date or timezone. */
export const getCalendarDateLib = (locale: string = "en") =>
  getDateCalendar(locale) === "persian"
    ? {
        addMonths: addJalaliMonths,
        addYears: addJalaliYears,
        getDate: getJalaliDate,
        getDaysInMonth: getJalaliDaysInMonth,
        getMonth: getJalaliMonth,
        getYear: getJalaliYear,
        setMonth: setJalaliMonth,
        startOfMonth: startOfJalaliMonth,
      }
    : { addMonths, addYears, getDate, getDaysInMonth, getMonth, getYear, setMonth, startOfMonth };

/**
 * @returns {ICalendarPayload} calendar payload to render the calendar
 * @param {ICalendarPayload | null} currentStructure current calendar payload
 * @param {Date} startDate date of the month to render
 * @param {EStartOfTheWeek} startOfWeek the day to start the week on
 * @description Returns calendar payload to render the calendar, if currentStructure is null, it will generate the payload for the month of startDate, else it will construct the payload for the month of startDate and append it to the currentStructure
 */
export const generateCalendarData = (
  currentStructure: ICalendarPayload | null,
  startDate: Date,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY,
  locale: string = "en"
): ICalendarPayload => {
  const calendarData: ICalendarPayload = currentStructure ?? {};

  const calendar = getCalendarDateLib(locale);
  const currentDate = calendar.startOfMonth(startDate);
  const year = calendar.getYear(currentDate);
  const month = calendar.getMonth(currentDate);
  const totalDaysInMonth = calendar.getDaysInMonth(currentDate);
  const firstDayOfMonthRaw = currentDate.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

  // Adjust firstDayOfMonth based on startOfWeek preference
  // This calculates how many empty cells we need at the start of the calendar
  const firstDayOfMonth = (firstDayOfMonthRaw - startOfWeek + 7) % 7;

  calendarData[`y-${year}`] ||= {};
  // Always reset the month data to ensure clean regeneration with correct startOfWeek
  calendarData[`y-${year}`][`m-${month}`] = {};

  const numWeeks = Math.ceil((totalDaysInMonth + firstDayOfMonth) / 7);

  for (let week = 0; week < numWeeks; week++) {
    const currentWeekObject: { [date: string]: ICalendarDate } = {};

    const weekNumber = getWeekNumberOfDate(addDays(currentDate, week * 7 - firstDayOfMonth));

    for (let i = 0; i < 7; i++) {
      const dayNumber = week * 7 + i - firstDayOfMonth;

      const date = addDays(currentDate, dayNumber);

      const formattedDatePayload = renderFormattedPayloadDate(date);
      if (formattedDatePayload)
        currentWeekObject[formattedDatePayload] = {
          date,
          year,
          month,
          day: dayNumber + 1,
          week: weekNumber,
          is_current_month: calendar.getMonth(date) === month && calendar.getYear(date) === year,
          is_current_week: getWeekNumberOfDate(date) === getWeekNumberOfDate(new Date()),
          is_today: date.toDateString() === new Date().toDateString(),
        };
    }

    // Use sequential week index instead of calculated week number for the key
    // This ensures weeks are grouped correctly regardless of startOfWeek preference
    calendarData[`y-${year}`][`m-${month}`][`w-${week}`] = currentWeekObject;
  }

  return calendarData;
};

/**
 * Returns a new array sorted by the startOfWeek.
 * @param items Array of items to sort.
 * @param getDayIndex Function to get the day index (0-6) from an item.
 * @param startOfWeek The day to start the week on.
 */
export const getOrderedDays = <T>(
  items: T[],
  getDayIndex: (item: T) => number,
  startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY
): T[] =>
  items.toSorted((a, b) => {
    const dayA = (7 + getDayIndex(a) - startOfWeek) % 7;
    const dayB = (7 + getDayIndex(b) - startOfWeek) % 7;
    return dayA - dayB;
  });
