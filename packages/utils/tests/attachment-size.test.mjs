/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { convertBytesToSize } from "../dist/index.js";

test("Persian file sizes retain nonzero bytes and localize digits, fractions and units", () => {
  assert.equal(convertBytesToSize(0, "fa"), "۰ بایت");
  assert.equal(convertBytesToSize(68, "fa"), "۶۸ بایت");
  assert.equal(convertBytesToSize(1023, "fa"), "۱٬۰۲۳ بایت");
  assert.equal(convertBytesToSize(1024, "fa"), "۱ کیلوبایت");
  assert.equal(convertBytesToSize(1536, "fa"), "۱٫۵ کیلوبایت");
  assert.equal(convertBytesToSize(1024 * 1024, "fa"), "۱ مگابایت");
  assert.equal(convertBytesToSize(1572864, "fa"), "۱٫۵ مگابایت");
  assert.equal(convertBytesToSize(68, "fa-IR"), "۶۸ بایت");
});

test("English defaults describe the actual size and Ukrainian uses its registered locale alias", () => {
  assert.equal(convertBytesToSize(68), "68 bytes");
  assert.equal(convertBytesToSize(1024, "en"), "1 kilobyte");
  assert.equal(convertBytesToSize(1536, "en"), "1.5 kilobytes");
  assert.equal(convertBytesToSize(1048576, "en"), "1 megabyte");
  assert.equal(convertBytesToSize(1536, "ua"), convertBytesToSize(1536, "uk-UA"));
  assert.match(convertBytesToSize(1536, "ua"), /кілобайт/);
});
