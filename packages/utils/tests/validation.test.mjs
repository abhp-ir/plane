/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePersonName, validateDisplayName, validateWorkspaceName } from "../dist/index.js";

test("person names preserve Unicode letters, combining marks, apostrophes and interior ZWNJ", () => {
  for (const name of [
    "احمدی‌نژاد",
    "سارا احمدی‌نژاد",
    "محمد‌رضا",
    "سَارا",
    "John Smith",
    "Jean-Paul",
    "O'Brien",
    "O’Brien",
    "Jose\u0301",
    "李明",
    "علی",
    "A",
    "a".repeat(50),
  ]) {
    assert.equal(validatePersonName(name), true, name);
  }
});

test("workspace name validation retains its policy and returns translatable error keys", () => {
  for (const name of ["Acme Corp", "فضای کاری", "شرکت_123", "a".repeat(80)]) {
    assert.equal(validateWorkspaceName(name, true), true);
  }
  assert.equal(validateWorkspaceName(""), true);
  assert.equal(validateWorkspaceName("", true), "name_is_required");
  assert.equal(validateWorkspaceName("a".repeat(81)), "workspace_creation.errors.validation.name_length");
  assert.equal(validateWorkspaceName("<script>"), "workspace_creation.errors.validation.name_alphanumeric");
  assert.equal(validateWorkspaceName("---"), "workspace_creation.errors.validation.name_contains_letter_number");
});

test("person names reject unsafe controls, markup, invalid ZWNJ boundaries and overlong input", () => {
  assert.equal(validatePersonName(""), "name_is_required");
  assert.equal(validatePersonName("a".repeat(51)), "validation.person_name.max_length");
  assert.equal(validatePersonName("<script>"), "validation.person_name.invalid");
  for (const name of [
    "",
    " ",
    "a".repeat(51),
    "<script>alert(1)</script>",
    "{name}",
    "name@example.test",
    "John\nSmith",
    "John\tSmith",
    "John\rSmith",
    "John\u0000Smith",
    "John\u007fSmith",
    "John\u200bSmith",
    "John\u200dSmith",
    "John\u202eSmith",
    "John\u2066Smith",
    "‌علی",
    "علی‌",
    "علی‌‌رضا",
    "علی‌ رضا",
    "علی ‌رضا",
    "---",
  ]) {
    assert.notEqual(validatePersonName(name), true, JSON.stringify(name));
  }
  // Person-name apostrophes must not relax the separate username policy.
  assert.notEqual(validateDisplayName("O'Brien"), true);
});
