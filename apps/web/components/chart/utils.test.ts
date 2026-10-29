/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it } from "vitest";
import { initPromise, i18nInstance, setLanguage } from "@plane/i18n";
import { ChartXAxisDateGrouping } from "@plane/constants";
import { ChartXAxisProperty } from "@plane/types";
import type { TChart } from "@plane/types";
import { parseChartData } from "./utils";

const translate = (key: string) => String(i18nInstance.t(key));

it("translates owned priority/group identities while preserving keys, numeric counts and source data", async () => {
  await initPromise;
  await setLanguage("fa");
  const source: TChart = {
    data: [
      { key: "high", name: "high", count: 7 },
      { key: "none", name: "none", count: 0 },
    ],
    schema: {},
  };
  const before = structuredClone(source);
  const result = parseChartData(source, ChartXAxisProperty.PRIORITY, undefined, undefined, "fa", translate);
  expect(result.data.map((row) => row.name)).toEqual(["بالا", "هیچ‌کدام"]);
  expect(result.data.map((row) => [row.key, row.count])).toEqual([
    ["high", 7],
    ["none", 0],
  ]);
  expect(source).toEqual(before);
  const groups: TChart = {
    data: [
      { key: "started", name: "Started", count: 2 },
      { key: "unstarted", name: "Unstarted", count: 1 },
    ],
    schema: {},
  };
  expect(
    parseChartData(groups, ChartXAxisProperty.STATE_GROUPS, undefined, undefined, "fa", translate).data.map(
      (row) => row.name
    )
  ).toEqual(["در حال انجام", "شروع‌نشده"]);
});

it("preserves editable/imported English names including words matching fixed enums or missing-value text", async () => {
  await initPromise;
  await setLanguage("fa");
  for (const property of [
    ChartXAxisProperty.STATES,
    ChartXAxisProperty.LABELS,
    ChartXAxisProperty.ASSIGNEES,
    ChartXAxisProperty.CYCLES,
    ChartXAxisProperty.MODULES,
    ChartXAxisProperty.ESTIMATE_POINTS,
  ]) {
    const source: TChart = {
      data: [
        { key: "owned-uuid-1", name: "high", count: 3 },
        { key: "owned-uuid-2", name: "None", count: 2 },
        { key: "0", name: "001", count: 4 },
      ],
      schema: {},
    };
    expect(parseChartData(source, property, undefined, undefined, "fa", translate)).toEqual(source);
  }
});

it("localizes stacked fixed group labels by schema identity without changing values or missing-key fills", async () => {
  await initPromise;
  await setLanguage("fa");
  const source: TChart = {
    data: [{ key: "owned-module", name: "Started", count: 7, high: 7 }],
    schema: { high: "High", none: "None" },
  };
  const before = structuredClone(source);
  const result = parseChartData(
    source,
    ChartXAxisProperty.MODULES,
    ChartXAxisProperty.PRIORITY,
    undefined,
    "fa",
    translate
  );
  expect(result.schema).toEqual({ high: "بالا", none: "هیچ‌کدام" });
  expect(result.data).toEqual([{ key: "owned-module", name: "Started", count: 7, high: 7, none: 0 }]);
  expect(source).toEqual(before);
});

it("keeps API civil-day buckets accurate at leap Esfand/Nowruz in each locale without inventing monthly aggregation", async () => {
  await initPromise;
  const source: TChart = {
    data: [
      { key: "2025-03-20", name: "2025-03-20", count: 2 },
      { key: "2025-03-21", name: "2025-03-21", count: 3 },
      { key: "None", name: "None", count: 1 },
    ],
    schema: {},
  };
  const before = structuredClone(source);
  await setLanguage("fa");
  const result = parseChartData(source, ChartXAxisProperty.TARGET_DATE, undefined, undefined, "fa", translate);
  expect(result.data.map((row) => row.name)).toEqual(["اسف ۳۰, ۱۴۰۳", "فرو ۰۱, ۱۴۰۴", "هیچ‌کدام"]);
  expect(
    parseChartData(source, ChartXAxisProperty.TARGET_DATE, undefined, ChartXAxisDateGrouping.MONTH, "fa", translate)
  ).toEqual(result);
  await setLanguage("en");
  expect(
    parseChartData(source, ChartXAxisProperty.TARGET_DATE, undefined, undefined, "en", translate).data.map(
      (row) => row.name
    )
  ).toEqual(["Mar 20, 2025", "Mar 21, 2025", "None"]);
  expect(result.data.map((row) => [row.key, row.count])).toEqual(before.data.map((row) => [row.key, row.count]));
  expect(source).toEqual(before);
});
