/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import * as utils from "../dist/index.js";

test("Persian defaults are Saturday-first with Thursday/Friday off; other locales retain Sunday and Monday–Friday", () => {
  assert.deepEqual(utils.getCalendarPreferences(undefined, "fa"), { startOfWeek: 6, workingDays: [6, 0, 1, 2, 3] });
  for (const locale of ["en", "de", "ua", "ar"]) {
    assert.deepEqual(utils.getCalendarPreferences(undefined, locale), { startOfWeek: 0, workingDays: [1, 2, 3, 4, 5] });
  }
});

test("every explicit week start, including Sunday zero, and every weekday identity survives a locale switch", () => {
  for (let start = 0; start < 7; start++) {
    for (let day = 0; day < 7; day++) {
      const profile = Object.freeze({ start_of_the_week: start, working_days: Object.freeze([day]) });
      for (const locale of ["fa", "en"]) {
        assert.deepEqual(utils.getCalendarPreferences(profile, locale), { startOfWeek: start, workingDays: [day] });
      }
    }
  }
});

test("Thursday on/off changes only working-day membership, independently of week ordering", () => {
  const five = [6, 0, 1, 2, 3],
    six = [...five, 4];
  for (const start of [0, 1, 6]) {
    for (const workingDays of [five, six]) {
      const result = utils.getCalendarPreferences({ start_of_the_week: start, working_days: workingDays }, "fa");
      assert.equal(result.startOfWeek, start);
      assert.deepEqual(
        Array.from({ length: 7 }, (_, day) => result.workingDays.includes(day)),
        workingDays === five
          ? [true, true, true, true, false, false, true]
          : [true, true, true, true, true, false, true]
      );
    }
  }
});

test("a missing Persian week start generates real Saturday-through-Friday grids across Nowruz and year boundaries", () => {
  for (const anchor of ["2024-03-20", "2025-03-20", "2025-03-21", "2026-03-21", "2026-12-31"]) {
    const payload = utils.generateCalendarData(null, new Date(anchor + "T00:00:00"), undefined, "fa");
    const weeks = Object.values(Object.values(Object.values(payload)[0])[0]);
    for (const week of weeks) {
      assert.equal(Object.values(week)[0].date.getDay(), 6);
      assert.equal(Object.values(week).at(-1).date.getDay(), 5);
    }
  }
});
