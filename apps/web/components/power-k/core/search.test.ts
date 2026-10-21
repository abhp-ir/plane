/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it } from "vitest";
import { filterPowerKCommand } from "./search";

it("matches localized names, English aliases and Persian keyboard variants without changing identity or input", () => {
  const value = "open_project";
  const keywords = ["بازکردن پروژه", "Open project", "switch project", "شروع‌نشده", "کدی"];
  for (const query of ["پروژه", "Open project", "SWITCH PROJECT", "شروع نشده", " كد ي "]) {
    expect(filterPowerKCommand(value, query, keywords)).toBe(1);
  }
  expect(filterPowerKCommand(value, "not a command", keywords)).toBe(0);
  expect(filterPowerKCommand(value, "", keywords)).toBe(1);
  expect(value).toBe("open_project");
  expect(keywords[3]).toBe("شروع‌نشده");
});

it("keeps the existing no-results action discoverable", () => {
  expect(filterPowerKCommand("no-results", "هیچ نتیجه‌ای نیست")).toBe(1);
});

it("matches the real English phrase when a query omits its article", () => {
  expect(filterPowerKCommand("open_project", "Open project", ["Open a project"])).toBe(1);
});
