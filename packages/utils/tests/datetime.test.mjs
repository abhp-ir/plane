/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { getDateCalendar, getWeekdayLabel, renderLocalizedDateTime } from "../dist/index.js";

test("localized timestamps use Jalali for Persian while retaining 24-hour local time", () => {
  const date = new Date(2025, 5, 15, 18, 30);
  assert.deepEqual(renderLocalizedDateTime(date, "en"), { date: "Jun 15, 2025", time: "18:30" });
  assert.deepEqual(renderLocalizedDateTime(date, "fa"), { date: "۲۵ خرداد ۱۴۰۴", time: "۱۸:۳۰" });
  assert.equal(renderLocalizedDateTime(date, "ua").date, "15 черв. 2025 р.");
  assert.deepEqual(renderLocalizedDateTime(date.toISOString(), "fa"), renderLocalizedDateTime(date, "fa"));
  assert.deepEqual(renderLocalizedDateTime("invalid", "fa"), { date: "", time: "" });
});

test("Persian timestamps match independently verified leap Esfand and Nowruz days", () => {
  assert.equal(getDateCalendar("fa-IR"), "persian");
  assert.equal(getDateCalendar("en"), "gregory");
  for (const [day, expected] of [
    ["2024-03-20", "۱ فروردین ۱۴۰۳"],
    ["2025-03-20", "۳۰ اسفند ۱۴۰۳"],
    ["2025-03-21", "۱ فروردین ۱۴۰۴"],
    ["2026-03-21", "۱ فروردین ۱۴۰۵"],
  ]) {
    const instant = `${day}T12:00:00.000Z`;
    assert.equal(renderLocalizedDateTime(instant, "fa").date, expected);
    assert.equal(new Date(instant).toISOString(), instant);
  }
});

test("Jalali presentation retains timezone boundaries and canonical date-only payloads", () => {
  const script = `
    import { renderLocalizedDateTime, renderFormattedPayloadDate } from ${JSON.stringify(new URL("../dist/index.js", import.meta.url).href)};
    const values = ["2025-03-20T22:00:00Z", "2025-03-21T01:00:00Z"];
    console.log(JSON.stringify({ dates: values.map(value => renderLocalizedDateTime(value, "fa")), payload: renderFormattedPayloadDate("2025-03-21") }));
  `;
  for (const [zone, expected] of [
    [
      "UTC",
      [
        { date: "۳۰ اسفند ۱۴۰۳", time: "۲۲:۰۰" },
        { date: "۱ فروردین ۱۴۰۴", time: "۱:۰۰" },
      ],
    ],
    [
      "Asia/Tehran",
      [
        { date: "۱ فروردین ۱۴۰۴", time: "۱:۳۰" },
        { date: "۱ فروردین ۱۴۰۴", time: "۴:۳۰" },
      ],
    ],
    [
      "America/Los_Angeles",
      [
        { date: "۳۰ اسفند ۱۴۰۳", time: "۱۵:۰۰" },
        { date: "۳۰ اسفند ۱۴۰۳", time: "۱۸:۰۰" },
      ],
    ],
  ]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      env: { ...process.env, TZ: zone },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { dates: expected, payload: "2025-03-21" }, zone);
  }
});

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
