/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { EProductSubscriptionEnum } from "@plane/types";
import { DiscountInfo } from "./discount-info";

const locale = vi.hoisted(() => ({ value: "fa" }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ currentLocale: locale.value }) }));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));

it.each([
  ["fa", EProductSubscriptionEnum.PRO, "۱۰", "۷٫۵"],
  ["en", EProductSubscriptionEnum.PRO, "10", "7.5"],
  ["fa", EProductSubscriptionEnum.BUSINESS, undefined, "۷٫۵"],
] as const)("formats %s prices without changing the amount or plan (%s)", (language, plan, oldPrice, price) => {
  locale.value = language;
  const props = { currency: "$", frequency: "month" as const, price: 7.5, subscriptionType: plan };
  const html = renderToStaticMarkup(createElement(DiscountInfo, props));
  expect(html).toContain(price);
  if (oldPrice) {
    expect(html).toContain(oldPrice);
    expect(html).toContain('alt=""');
  } else expect(html).not.toContain("<img");
  expect(html).not.toContain('alt="scribble"');
  expect(props.price).toBe(7.5);
  expect(props.currency).toBe("$");
  expect(props.subscriptionType).toBe(plan);
});
