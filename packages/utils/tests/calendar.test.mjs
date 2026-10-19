/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { generateCalendarData, renderFormattedPayloadDate } from "../dist/index.js";

const localDate = (value) => new Date(`${value}T00:00:00`);
const cells = (payload) => Object.values(Object.values(Object.values(payload)[0])[0]).flatMap(Object.values);

test("Gregorian grids retain their canonical days for every week start and other locales", () => {
  const first = ["2025-02-23", "2025-02-24", "2025-02-25", "2025-02-26", "2025-02-27", "2025-02-28", "2025-03-01"];
  const last = ["2025-04-05", "2025-04-06", "2025-03-31", "2025-04-01", "2025-04-02", "2025-04-03", "2025-04-04"];
  for (let weekStart = 0; weekStart < 7; weekStart++) {
    const original = generateCalendarData(null, localDate("2025-03-20"), weekStart);
    const days = cells(original);
    assert.equal(renderFormattedPayloadDate(days[0].date), first[weekStart]);
    assert.equal(renderFormattedPayloadDate(days.at(-1).date), last[weekStart]);
    assert.equal(days.filter((day) => day.is_current_month).length, 31);
    for (const locale of ["en", "ar", "de", "ua"]) {
      assert.deepEqual(generateCalendarData(null, localDate("2025-03-20"), weekStart, locale), original);
    }
  }
});

// Literal Nowruz/leap fixtures, independent of the selected calendar implementation.
for (const [anchor, year, month, firstDay, lastDay, length] of [
  ["2024-03-20", 1403, 0, "2024-03-20", "2024-04-19", 31],
  ["2025-03-20", 1403, 11, "2025-02-19", "2025-03-20", 30],
  ["2025-03-21", 1404, 0, "2025-03-21", "2025-04-20", 31],
  ["2026-03-20", 1404, 11, "2026-02-20", "2026-03-20", 29],
  ["2026-03-21", 1405, 0, "2026-03-21", "2026-04-20", 31],
]) {
  test(`Jalali ${year}/${month + 1} has the actual days, adjacent flags and canonical keys for all seven week starts`, () => {
    for (let weekStart = 0; weekStart < 7; weekStart++) {
      const input = localDate(anchor);
      const epoch = input.getTime();
      const payload = generateCalendarData(null, input, weekStart, "fa");
      assert.ok(payload[`y-${year}`]?.[`m-${month}`], "a Jalali heading over a Gregorian grid must fail");
      const weeks = Object.values(payload[`y-${year}`][`m-${month}`]);
      const days = weeks.flatMap(Object.values);
      const keys = weeks.flatMap(Object.keys);
      const current = days.filter((day) => day.is_current_month);
      assert.equal(current.length, length);
      assert.equal(renderFormattedPayloadDate(current[0].date), firstDay);
      assert.equal(renderFormattedPayloadDate(current.at(-1).date), lastDay);
      assert.equal(new Set(keys).size, days.length);
      assert.equal(days[0].date.getDay(), weekStart);
      assert.equal(days.at(-1).date.getDay(), (weekStart + 6) % 7);
      for (const week of weeks) assert.equal(Object.keys(week).length, 7);
      for (let index = 0; index < days.length; index++) {
        assert.equal(keys[index], renderFormattedPayloadDate(days[index].date));
        assert.match(keys[index], /^\d{4}-\d{2}-\d{2}$/);
        if (index) {
          const next = new Date(days[index - 1].date);
          next.setDate(next.getDate() + 1);
          assert.equal(days[index].date.getTime(), next.getTime());
        }
      }
      assert.equal(input.getTime(), epoch);
    }
  });
}

test("calendar navigation crosses Nowruz and preserves canonical dates without mutating inputs", async () => {
  const { getCalendarDateLib } = await import("../dist/index.js");
  const fa = getCalendarDateLib("fa");
  const en = getCalendarDateLib("en");
  const leapDay = localDate("2025-03-20");
  const epoch = leapDay.getTime();
  assert.equal(renderFormattedPayloadDate(fa.startOfMonth(leapDay)), "2025-02-19");
  assert.equal(renderFormattedPayloadDate(fa.addMonths(fa.startOfMonth(leapDay), 1)), "2025-03-21");
  assert.equal(renderFormattedPayloadDate(fa.addMonths(localDate("2025-03-21"), -1)), "2025-02-19");
  assert.equal(renderFormattedPayloadDate(fa.addYears(fa.startOfMonth(leapDay), 1)), "2026-02-20");
  assert.equal(renderFormattedPayloadDate(fa.setMonth(fa.startOfMonth(leapDay), 0)), "2024-03-20");
  assert.equal(renderFormattedPayloadDate(fa.setMonth(localDate("2025-03-21"), 11)), "2026-02-20");
  assert.equal(renderFormattedPayloadDate(en.addMonths(en.startOfMonth(leapDay), 1)), "2025-04-01");
  assert.equal(leapDay.getTime(), epoch);
});
