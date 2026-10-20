/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { SUPPORTED_LANGUAGES, getRegisteredLanguage } from "../src/constants/language";
import { initPromise, i18nInstance } from "../src/core/instance";
import { setLanguage } from "../src/core/set-language";

test("every registered locale loads navigation and Page metadata through the public setter", async () => {
  await initPromise;
  try {
    for (const { value: language } of SUPPORTED_LANGUAGES) {
      const resource = JSON.parse(
        readFileSync(path.resolve(__dirname, `../src/locales/${language}/navigation.json`), "utf8")
      );
      // eslint-disable-next-line no-await-in-loop -- Locale switches share one instance and must finish in order.
      await setLanguage(language);
      assert.equal(
        getRegisteredLanguage(i18nInstance.language),
        language,
        `${language}: preserve registered identifier`
      );
      assert.equal(i18nInstance.t("sidebar.home"), resource.sidebar.home, `${language}: translated navigation`);
      assert.equal(
        i18nInstance.hasResourceBundle(i18nInstance.language, "navigation"),
        true,
        `${language}: actual lazy bundle`
      );
      assert.equal(i18nInstance.dir(), language === "fa" ? "rtl" : "ltr", `${language}: direction`);
      const page = JSON.parse(readFileSync(path.resolve(__dirname, `../src/locales/${language}/page.json`), "utf8"));
      assert.equal(
        i18nInstance.t("page_metadata.archive_date"),
        page.page_metadata.archive_date,
        `${language}: archive date label`
      );
      assert.equal(i18nInstance.hasResourceBundle(i18nInstance.language, "page"), true, `${language}: Page bundle`);
    }
  } finally {
    await setLanguage("en");
  }
});
