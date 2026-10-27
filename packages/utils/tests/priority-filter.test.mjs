/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ISSUE_PRIORITIES } from "@plane/constants";
import { COLLECTION_OPERATOR } from "@plane/types";
import { getPriorityFilterConfig, getTargetDateFilterConfig } from "../dist/index.js";

const params = { isEnabled: true, allowedOperators: new Set([COLLECTION_OPERATOR.IN]) };
const labels = { urgent: "فوری", high: "زیاد", medium: "متوسط", low: "کم", none: "هیچ‌کدام" };

test("priority filter presentation preserves canonical IDs, values and default labels", () => {
  const before = structuredClone(ISSUE_PRIORITIES);
  const config = getPriorityFilterConfig("priority")({
    ...params,
    label: "اولویت",
    getPriorityLabel: (key) => labels[key],
  });
  assert.equal(config.label, "اولویت");
  assert.deepEqual(
    config.supportedOperatorConfigsMap
      .get(COLLECTION_OPERATOR.IN)
      .getOptions()
      .map(({ id, value, label }) => ({ id, value, label })),
    ISSUE_PRIORITIES.map(({ key }) => ({ id: key, value: key, label: labels[key] }))
  );
  const original = getPriorityFilterConfig("priority")(params);
  assert.deepEqual(
    original.supportedOperatorConfigsMap
      .get(COLLECTION_OPERATOR.IN)
      .getOptions()
      .map(({ label }) => label),
    ISSUE_PRIORITIES.map(({ title }) => title)
  );
  assert.deepEqual(ISSUE_PRIORITIES, before);
});

test("localized date heading retains its property and operator configuration", () => {
  const original = getTargetDateFilterConfig("target_date")(params);
  const localized = getTargetDateFilterConfig("target_date")({ ...params, label: "موعد انجام" });
  const { supportedOperatorConfigsMap: originalFields, ...originalBase } = original;
  const { supportedOperatorConfigsMap: localizedFields, ...localizedBase } = localized;
  assert.deepEqual({ ...localizedBase, label: originalBase.label }, originalBase);
  assert.deepEqual([...localizedFields.keys()], [...originalFields.keys()]);
  for (const [operator, field] of localizedFields) {
    const originalField = originalFields.get(operator);
    const { label: originalLabel, ...originalBehavior } = originalField;
    const { label, ...localizedBehavior } = field;
    assert.equal(originalLabel, undefined);
    assert.equal(label, "موعد انجام");
    assert.deepEqual(localizedBehavior, originalBehavior);
  }
  assert.equal(localized.id, "target_date");
  assert.equal(localized.label, "موعد انجام");
});
