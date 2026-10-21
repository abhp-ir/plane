/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSearchQuery } from "../dist/index.js";

test("search comparison handles Persian ZWNJ, spaces and Arabic keyboard variants without changing input", () => {
  const query = "  شروع‌نشده  ";
  assert.equal(normalizeSearchQuery(query), normalizeSearchQuery("شروع نشده"));
  assert.equal(normalizeSearchQuery(" كد ي "), normalizeSearchQuery("کدی"));
  assert.equal(normalizeSearchQuery("Create Work Item"), "createworkitem");
  assert.equal(query, "  شروع‌نشده  ");
  assert.equal(normalizeSearchQuery(""), "");
});
