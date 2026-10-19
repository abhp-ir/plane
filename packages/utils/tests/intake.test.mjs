/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { EPastDurationFilters } from "@plane/constants";
import { getCustomDates } from "../dist/index.js";

test("custom Intake bounds retain their canonical Gregorian days and comparison codes", () => {
  assert.equal(getCustomDates("2025-03-20;after"), "2025-03-20;after");
  assert.equal(getCustomDates("2025-03-21;before"), "2025-03-21;before");
});

test("Intake presets retain existing day durations across Nowruz", (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date(2025, 2, 21, 12).getTime() });
  assert.equal(getCustomDates(EPastDurationFilters.TODAY), "2025-03-21;after,2025-03-21;before");
  assert.equal(getCustomDates(EPastDurationFilters.YESTERDAY), "2025-03-20;after,2025-03-20;before");
  assert.equal(getCustomDates(EPastDurationFilters.LAST_7_DAYS), "2025-03-14;after,2025-03-21;before");
  assert.equal(getCustomDates(EPastDurationFilters.LAST_30_DAYS), "2025-02-19;after,2025-03-21;before");
});
