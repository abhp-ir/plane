/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  formatDateRange,
  generateDateArray,
  getDate,
  getDateCalendar,
  getWeekdayLabel,
  renderFormattedDate,
  renderFormattedDateWithoutYear,
  renderFormattedPayloadDate,
  renderLocalizedDateTime,
} from "../dist/index.js";

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
    import { renderLocalizedDateTime, renderFormattedPayloadDate, renderFormattedDate } from ${JSON.stringify(new URL("../dist/index.js", import.meta.url).href)};
    const values = ["2025-03-20T22:00:00Z", "2025-03-21T01:00:00Z"];
    console.log(JSON.stringify({ dates: values.map(value => renderLocalizedDateTime(value, "fa")), payload: renderFormattedPayloadDate("2025-03-21"), shown: renderFormattedDate("2025-03-21", "yyyy/MM/dd", "fa") }));
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
    assert.deepEqual(JSON.parse(result.stdout), { dates: expected, payload: "2025-03-21", shown: "۱۴۰۴/۰۱/۰۱" }, zone);
  }
});

test("formatted UI dates retain format ordering and canonical values in Persian", () => {
  const date = getDate("2025-03-20");
  const epoch = date.getTime();
  for (const [token, expected] of [
    ["MMM dd, yyyy", "اسف ۳۰, ۱۴۰۳"],
    ["dd/MM/yyyy", "۳۰/۱۲/۱۴۰۳"],
    ["MM/dd/yyyy", "۱۲/۳۰/۱۴۰۳"],
    ["yyyy/MM/dd", "۱۴۰۳/۱۲/۳۰"],
    ["d MMMM yyyy", "۳۰ اسفند ۱۴۰۳"],
  ]) {
    assert.equal(renderFormattedDate(date, token, "fa"), expected);
    assert.equal(renderFormattedDate("2025-03-20", token, "fa-IR"), expected);
  }
  assert.equal(renderFormattedDateWithoutYear("2025-03-20", "fa"), "اسف ۳۰");
  assert.equal(date.getTime(), epoch);
  assert.equal(renderFormattedDate(date), "Mar 20, 2025");
  assert.equal(renderFormattedDate(date, undefined, "fr"), "Mar 20, 2025");
});

test("Jalali merged ranges compare the displayed calendar month and year", () => {
  const day = (value) => getDate(value);
  assert.equal(formatDateRange(day("2025-03-20"), day("2025-03-21"), "fa"), "اسف ۳۰, ۱۴۰۳ - فرو ۰۱, ۱۴۰۴");
  assert.equal(formatDateRange(day("2025-03-25"), day("2025-04-10"), "fa"), "فرو ۰۵ - ۲۱, ۱۴۰۴");
  assert.equal(formatDateRange(day("2025-06-15"), day("2025-07-01"), "fa"), "خرد ۲۵ - تیر ۱۰, ۱۴۰۴");
  assert.equal(formatDateRange(null, day("2025-03-21"), "fa"), "فرو ۰۱, ۱۴۰۴");
  assert.equal(formatDateRange(day("2025-03-20"), null, "fa"), "اسف ۳۰, ۱۴۰۳");
  assert.equal(formatDateRange(null, null, "fa"), "");
  assert.equal(formatDateRange(day("2025-03-20"), day("2025-03-21")), "Mar 20 - 21, 2025");
});

test("localized formatted dates preserve invalid, empty and fallback behavior", () => {
  assert.equal(renderFormattedDate(null, undefined, "fa"), undefined);
  assert.equal(renderFormattedDate("invalid", undefined, "fa"), undefined);
  assert.equal(renderFormattedDate(new Date(NaN), undefined, "fa"), undefined);
  assert.equal(renderFormattedDateWithoutYear("invalid", "fa"), "");
  assert.equal(renderFormattedDate("2025-03-20", "f", "fa"), "اسف ۳۰, ۱۴۰۳");
});

test("date parsing and day iteration preserve their canonical contracts", () => {
  const start = new Date("2025-03-08T12:00:00Z");
  const end = new Date("2025-03-10T12:00:00Z");
  assert.equal(getDate(start), start);
  assert.equal(renderFormattedPayloadDate(new String("2025-03-20")), "2025-03-20");
  assert.equal(renderFormattedPayloadDate("2025-03-20T23:59:00Z"), "2025-03-20");
  assert.deepEqual(generateDateArray(start, end), [
    { date: "2025-03-08" },
    { date: "2025-03-09" },
    { date: "2025-03-10" },
    { date: "2025-03-11" },
    { date: "2025-03-12" },
  ]);
  assert.equal(start.toISOString(), "2025-03-08T12:00:00.000Z");
  assert.equal(end.toISOString(), "2025-03-10T12:00:00.000Z");
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
