/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AreaChart } from "../area-chart/root";
import { BarChart } from "../bar-chart/root";
import { LineChart } from "../line-chart/root";
import { RadarChart } from "../radar-chart/root";

const fixture = vi.hoisted(() => ({
  language: "fa",
  point: { key: "high", caption: "بالا" as string | number, count: 7 },
  container: ({ children }: { children: ReactNode }) => children,
  shape: () => null,
}));

vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ currentLocale: fixture.language }) }));
vi.mock("recharts", () => {
  return {
    ResponsiveContainer: fixture.container,
    BarChart: fixture.container,
    ComposedChart: fixture.container,
    LineChart: fixture.container,
    RadarChart: fixture.container,
    CartesianGrid: fixture.shape,
    PolarGrid: fixture.shape,
    PolarAngleAxis: fixture.shape,
    XAxis: fixture.shape,
    YAxis: fixture.shape,
    Bar: fixture.shape,
    Area: fixture.shape,
    Line: fixture.shape,
    Radar: fixture.shape,
    Tooltip: ({ content }: { content: (props: unknown) => ReactNode }) =>
      content({
        active: true,
        label: "Previous category",
        payload: [{ dataKey: "count", value: 7, payload: fixture.point }],
      }),
  };
});

const axis = { xAxis: { key: "caption" as const }, yAxis: { key: "count" as const } };
const bar = { key: "count", label: "تعداد", stackId: "items", fill: "#123456", textClassName: "" };
const line = {
  key: "count",
  label: "تعداد",
  dashedLine: false,
  fill: "#123456",
  showDot: false,
  smoothCurves: false,
  stroke: "#123456",
};
const charts = {
  bar: () => <BarChart {...axis} data={[fixture.point]} bars={[bar]} />,
  area: () => (
    <AreaChart
      {...axis}
      data={[fixture.point]}
      areas={[{ ...line, stackId: "items", fillOpacity: 1, strokeColor: "#123456", strokeOpacity: 1 }]}
    />
  ),
  line: () => <LineChart {...axis} data={[fixture.point]} lines={[line]} />,
  radar: () => (
    <RadarChart
      data={[fixture.point]}
      dataKey="count"
      angleAxis={{ key: "caption" }}
      radars={[{ key: "count", name: "تعداد" }]}
      showTooltip
    />
  ),
};

it.each(Object.entries(charts))("uses the current datum category for %s tooltips after data changes", (_, render) => {
  for (const [language, value, expected] of [
    ["fa", "بالا", "بالا"],
    ["en", "High", "High"],
    ["fa", "بالا", "بالا"],
    ["fa", "Custom English review", "Custom English review"],
    ["fa", 0, "۰"],
    ["fa", "", ""],
  ] as const) {
    fixture.language = language;
    fixture.point.caption = value;
    const before = structuredClone(fixture.point);
    const html = renderToStaticMarkup(render());
    expect(html).not.toContain("Previous category");
    expect(html).toContain(`>${expected}</p>`);
    expect(fixture.point).toEqual(before);
  }
});

it.each([BarChart, LineChart])("gives custom tooltip renderers the current category and unchanged payload", (Chart) => {
  fixture.point.caption = "کار ABC-42";
  const content = vi.fn(() => null);
  renderToStaticMarkup(
    <Chart {...axis} data={[fixture.point]} bars={[bar]} lines={[line]} customTooltipContent={content} />
  );
  expect(content).toHaveBeenCalledWith({
    active: true,
    label: "کار ABC-42",
    payload: [{ dataKey: "count", value: 7, payload: fixture.point }],
  });
});
