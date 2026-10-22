/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TNameDescriptionLoader } from "@plane/types";
import { NameDescriptionUpdateStatus } from "./issue-update-status";

afterEach(async () => {
  await setLanguage("en");
});

it.each(["submitting", "submitted", "saved"] as const)(
  "localizes the %s indicator through fa→en→fa while preserving its state",
  async (isSubmitting: TNameDescriptionLoader) => {
    await initPromise;
    const checkLanguage = async (language: "fa" | "en") => {
      await setLanguage(language);
      const html = renderToStaticMarkup(
        createElement(TranslationProvider, null, createElement(NameDescriptionUpdateStatus, { isSubmitting }))
      );
      const saving = isSubmitting === "submitting";
      expect(html).toContain(language === "fa" ? (saving ? "در حال ذخیره" : "ذخیره شد") : saving ? "Saving" : "Saved");
      expect(html.includes("animate-spin")).toBe(saving);
      expect(html).toContain(isSubmitting === "saved" ? "fade-out" : "fade-in");
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
  }
);
