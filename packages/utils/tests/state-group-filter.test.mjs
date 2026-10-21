/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { STATE_GROUPS } from "@plane/constants";
import { COLLECTION_OPERATOR } from "@plane/types";
import { getStateFilterConfig, getStateGroupFilterConfig } from "../dist/index.js";

const params = { isEnabled: true, allowedOperators: new Set([COLLECTION_OPERATOR.IN]) };
const labels = {
  backlog: "بک‌لاگ",
  unstarted: "شروع‌نشده",
  started: "در حال انجام",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
};

test("state-group presentation localizes labels while retaining filter identities and values", () => {
  const config = getStateGroupFilterConfig("state_group")({
    ...params,
    label: "گروه وضعیت",
    getStateGroupLabel: (key) => labels[key],
  });
  assert.equal(config.label, "گروه وضعیت");
  const options = config.supportedOperatorConfigsMap.get(COLLECTION_OPERATOR.IN).getOptions();
  assert.deepEqual(
    options.map(({ id, value, label }) => ({ id, value, label })),
    Object.keys(STATE_GROUPS).map((key) => ({ id: key, value: key, label: labels[key] }))
  );
  const original = getStateGroupFilterConfig("state_group")(params);
  assert.deepEqual(
    original.supportedOperatorConfigsMap
      .get(COLLECTION_OPERATOR.IN)
      .getOptions()
      .map(({ label }) => label),
    Object.values(STATE_GROUPS).map(({ label }) => label)
  );
});

test("editable project state names are preserved even when they match English system phrases", () => {
  const states = Object.freeze([
    Object.freeze({ id: "custom-1", name: "Not started", group: "unstarted" }),
    Object.freeze({ id: "custom-2", name: "Working on", group: "started" }),
    Object.freeze({ id: "custom-3", name: "وضعیت دلخواه ABC-42", group: "completed" }),
  ]);
  const config = getStateFilterConfig("state_id")({ ...params, states });
  assert.deepEqual(
    config.supportedOperatorConfigsMap
      .get(COLLECTION_OPERATOR.IN)
      .getOptions()
      .map(({ id, value, label }) => ({ id, value, label })),
    states.map(({ id, name }) => ({ id, value: id, label: name }))
  );
});
