/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it } from "vitest";
import { findSlashCommandMatch, normalizeSlashCommandQuery } from "./slash-command-search";

it("compares Persian variants without changing text and maps highlights back to the original", () => {
  const text = "رنگ‌های پس‌زمینه آبی";
  expect(normalizeSlashCommandQuery(" كد ي ")).toBe("کدی");
  for (const query of ["پس زمینه", "پس‌زمینه", "پسزمینه"]) {
    const range = findSlashCommandMatch(text, query)!;
    expect(text.slice(range.from, range.to)).toBe("پس‌زمینه");
  }
  const range = findSlashCommandMatch(text, "آبي")!;
  expect(text.slice(range.from, range.to)).toBe("آبی");
  expect(findSlashCommandMatch(text, "CODEBLOCK")).toBeUndefined();
  expect(findSlashCommandMatch(text, " \u200c ")).toBeUndefined();
  expect(text).toBe("رنگ‌های پس‌زمینه آبی");
});
