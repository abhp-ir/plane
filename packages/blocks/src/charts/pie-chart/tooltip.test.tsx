/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { CustomPieChartTooltip } from "./tooltip";

const locale = vi.hoisted(() => ({ current: "fa" }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ currentLocale: locale.current }) }));

it("localizes numeric tooltip values while preserving data labels and original values", () => {
  const payload = [{ name: "custom ABC-42", value: 1234, dataKey: "count" }];
  for (const [language, expected] of [
    ["fa", "۱٬۲۳۴"],
    ["en", "1,234"],
    ["fa", "۱٬۲۳۴"],
  ]) {
    locale.current = language;
    const html = renderToStaticMarkup(<CustomPieChartTooltip label="Work items" payload={payload} />);
    expect(html).toContain(expected);
    expect(html).toContain("custom ABC-42");
    expect(payload[0].value).toBe(1234);
  }
});

it("preserves textual tooltip values", () => {
  locale.current = "fa";
  const html = renderToStaticMarkup(
    <CustomPieChartTooltip label="Work items" payload={[{ name: "custom", value: "ABC-42", dataKey: "value" }]} />
  );
  expect(html).toContain("ABC-42");
});
