/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";
import {
  DATE_AFTER_FILTER_OPTIONS,
  DATE_BEFORE_FILTER_OPTIONS,
  PROJECT_CREATED_AT_FILTER_OPTIONS,
} from "@plane/constants";
import { i18nInstance, initPromise, SUPPORTED_LANGUAGES } from "@plane/i18n";
import type { TTranslationStore } from "@plane/i18n";
import { formatFilterCount, getAppliedDateFilterLabel, getDateFilterOptionLabel } from "./filter-labels";

const options = [...DATE_AFTER_FILTER_OPTIONS, ...DATE_BEFORE_FILTER_OPTIONS, ...PROJECT_CREATED_AT_FILTER_OPTIONS];
vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("./__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});

it.each(SUPPORTED_LANGUAGES.map(({ value }) => value))(
  "formats canonical date choices in %s without changing values",
  async (language) => {
    await initPromise;
    await i18nInstance.loadLanguages(language);
    const original = structuredClone(options);
    const t: TTranslationStore["t"] = (key, params) => {
      const value = i18nInstance.t(key, { lng: language, ...params });
      expect(typeof value).toBe("string");
      return value as string;
    };
    const labels = options.map((option) => getDateFilterOptionLabel(option, language, t));
    expect(labels.every((label) => label && !label.includes("date_filters."))).toBe(true);
    if (language === "en") expect(labels).toEqual(options.map((option) => option.name));
    if (language === "fa") {
      expect(labels.join(" ")).not.toMatch(/[A-Za-z0-9]/);
      expect(labels).toContain("۳۰ روز گذشته");
      expect(formatFilterCount(1234, language)).toBe("۱٬۲۳۴");
      expect(getAppliedDateFilterLabel("2025-03-20;after", options, language, t)).toBe("پس از اسف ۳۰, ۱۴۰۳");
      expect(getAppliedDateFilterLabel("2025-03-21;before", options, language, t)).toBe("پیش از فرو ۰۱, ۱۴۰۴");
    }
    expect(getDateFilterOptionLabel({ name: "API-42", value: "opaque-value" }, language, t)).toBe("API-42");
    expect(options).toEqual(original);
  }
);
