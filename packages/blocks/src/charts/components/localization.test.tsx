/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { barShapeVariants } from "../bar-chart/bar";
import { CustomRadarAxisTick, CustomXAxisTick, CustomYAxisTick } from "./tick";
import { CustomTooltip } from "./tooltip";

const locale = vi.hoisted(() => ({ current: "fa" }));
const getLabel = (value: number) => `Custom-${value}`;
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ currentLocale: locale.current }) }));

it.each([CustomXAxisTick, CustomYAxisTick, CustomRadarAxisTick])(
  "formats numeric ticks while preserving string labels and coordinates in %s",
  (Tick) => {
    const payload = { value: 1234 };
    const geometries: string[] = [];
    for (const [language, expected] of [
      ["fa", "۱٬۲۳۴"],
      ["en", "1,234"],
      ["fa", "۱٬۲۳۴"],
    ]) {
      locale.current = language;
      const html = renderToStaticMarkup(<Tick x={20} y={30} cx={10} cy={10} payload={payload} />);
      expect(html).toContain(expected);
      expect(payload.value).toBe(1234);
      geometries.push(html.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, ""));
    }
    expect(new Set(geometries).size).toBe(1);
    expect(renderToStaticMarkup(<Tick x={20} y={30} cx={10} cy={10} payload={{ value: "ABC-42" }} />)).toContain(
      "ABC-42"
    );
  }
);

it("preserves explicit tick label formatters", () => {
  locale.current = "fa";
  for (const Tick of [CustomXAxisTick, CustomRadarAxisTick])
    expect(
      renderToStaticMarkup(<Tick x={20} y={30} cx={10} cy={10} payload={{ value: 123 }} getLabel={getLabel} />)
    ).toContain("Custom-123");
});

it("formats numeric tooltip headings and values without rewriting text, labels or data keys", () => {
  const payload = [
    { dataKey: "count", value: 1234 },
    { dataKey: "code", value: "ABC-42" },
  ];
  const before = structuredClone(payload);
  for (const [language, expected] of [
    ["fa", "۱٬۲۳۴"],
    ["en", "1,234"],
    ["fa", "۱٬۲۳۴"],
  ]) {
    locale.current = language;
    const html = renderToStaticMarkup(
      <CustomTooltip
        active
        label={1234}
        payload={payload}
        itemKeys={["count", "code"]}
        itemLabels={{ count: "Custom label", code: "Code" }}
        itemDotColors={{}}
      />
    );
    expect(html.match(new RegExp(expected, "g"))).toHaveLength(2);
    expect(html).toContain("ABC-42");
    expect(html).toContain("Custom label");
    expect(payload).toEqual(before);
  }
  expect(
    renderToStaticMarkup(
      <CustomTooltip
        active={false}
        label="ABC-42"
        payload={payload}
        itemKeys={["count"]}
        itemLabels={{ count: "Count" }}
        itemDotColors={{}}
      />
    )
  ).toBe("");
});

it.each(["bar", "lollipop", "lollipop-dotted"] as const)(
  "formats %s percentages without changing numeric geometry or stack data",
  (variant) => {
    const payload = { done: 1, pending: 3 };
    const shape = { x: 10, y: 20, width: 30, height: 40, dataKey: "done", payload };
    const bar = {
      key: "done",
      label: "Done",
      stackId: "items",
      fill: "#123456",
      textClassName: "",
      showPercentage: true,
    };
    const before = structuredClone({ shape, bar });
    const geometries: string[] = [];
    for (const [language, expected] of [
      ["fa", "۲۵٪"],
      ["en", "25%"],
      ["fa", "۲۵٪"],
    ]) {
      locale.current = language;
      const html = renderToStaticMarkup(<svg>{barShapeVariants[variant](shape, bar, ["done", "pending"])}</svg>);
      expect(html).toContain(expected);
      geometries.push(html.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, ""));
      expect({ shape, bar }).toEqual(before);
    }
    expect(new Set(geometries).size).toBe(1);
  }
);
