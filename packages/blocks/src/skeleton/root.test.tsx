/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { SelectOptionsSkeleton } from "../select/skeleton";
import { Skeleton } from "./root";

it.each([
  ["fa", "در حال بارگذاری محتوا", "در حال بارگذاری گزینه‌ها"],
  ["en", "Loading content", "Loading options"],
  ["fa", "در حال بارگذاری محتوا", "در حال بارگذاری گزینه‌ها"],
] as const)(
  "localizes loading status in %s and preserves explicit caller labels",
  async (language, content, options) => {
    await initPromise;
    try {
      await setLanguage(language);
      expect(
        renderToStaticMarkup(
          <Skeleton>
            <Skeleton.Item />
          </Skeleton>
        )
      ).toContain(`aria-label="${content}"`);
      expect(renderToStaticMarkup(<SelectOptionsSkeleton />)).toContain(`aria-label="${options}"`);
      expect(
        renderToStaticMarkup(
          <Skeleton ariaLabel="نام اختصاصی ABC-42">
            <Skeleton.Item />
          </Skeleton>
        )
      ).toContain('aria-label="نام اختصاصی ABC-42"');
    } finally {
      await setLanguage("en");
    }
  }
);
