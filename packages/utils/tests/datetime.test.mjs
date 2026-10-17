/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { getWeekdayLabel } from "../dist/index.js";

test("weekday labels localize the stored Sunday-zero enum without shifting its values", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((day) => getWeekdayLabel(day, "en")),
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  );
  assert.equal(getWeekdayLabel(0, "fa"), "یکشنبه");
  assert.equal(getWeekdayLabel(1, "fa"), "دوشنبه");
  assert.equal(getWeekdayLabel(6, "fa"), "شنبه");
  assert.equal(getWeekdayLabel(0, "ua"), "неділя");
});
