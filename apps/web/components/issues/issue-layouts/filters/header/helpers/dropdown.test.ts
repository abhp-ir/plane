/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { FiltersDropdown } from "./dropdown";

it.each([
  ["fa", "فیلترها"],
  ["en", "Filters"],
  ["fa", "فیلترها"],
] as const)("names custom filter triggers in %s and retains explicit caller names", async (locale, name) => {
  await initPromise;
  try {
    await setLanguage(locale);
    const props = { menuButton: createElement("span", null, "◇"), children: null };
    expect(renderToStaticMarkup(createElement(FiltersDropdown, props))).toContain(`aria-label="${name}"`);
    expect(renderToStaticMarkup(createElement(FiltersDropdown, { ...props, title: "عنوان ABC-42" }))).toContain(
      'aria-label="عنوان ABC-42"'
    );
  } finally {
    await setLanguage("en");
  }
});
