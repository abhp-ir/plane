/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateTimeAgo } from "../dist/index.js";

test("Persian relative time uses natural past/future phrases and Persian digits", (t) => {
  const now = new Date("2026-10-21T12:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now });
  for (const [duration, unit, futureText] of [
    [60_000, "دقیقه", "۵ دقیقه بعد"],
    [3_600_000, "ساعت", "۵ ساعت بعد"],
    [86_400_000, "روز", "۵ روز دیگر"],
  ]) {
    const past = new Date(now.getTime() - 5 * duration);
    const future = new Date(now.getTime() + 5 * duration);
    assert.equal(calculateTimeAgo(past.toISOString(), "fa"), `۵ ${unit} پیش`);
    assert.equal(calculateTimeAgo(future, "fa-IR"), futureText);
    assert.equal(calculateTimeAgo(past.getTime(), "fa"), `۵ ${unit} پیش`);
    assert.equal(future.getTime(), now.getTime() + 5 * duration);
  }
  assert.equal(calculateTimeAgo(now, "fa"), "اکنون");
  assert.equal(calculateTimeAgo(new Date(now.getTime() - 86_400_000), "fa"), "دیروز");
  assert.equal(calculateTimeAgo(new Date(now.getTime() + 86_400_000), "fa"), "فردا");
});

test("English relative-time wording remains compatible and invalid inputs stay empty", (t) => {
  const now = new Date("2026-10-21T12:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now });
  assert.equal(calculateTimeAgo(new Date(now.getTime() - 5 * 60_000)), "5 minutes ago");
  assert.equal(calculateTimeAgo(new Date(now.getTime() - 5 * 3_600_000), "en"), "about 5 hours ago");
  assert.equal(calculateTimeAgo(new Date(now.getTime() + 5 * 86_400_000), "en"), "in 5 days");
  for (const value of [null, "", "invalid", new Date(NaN), NaN]) {
    assert.equal(calculateTimeAgo(value, "fa"), "");
    assert.equal(calculateTimeAgo(value, "en"), "");
  }
  assert.notEqual(calculateTimeAgo(0, "fa"), "");
});
