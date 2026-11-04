/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createElement, type ReactNode } from "react";
import type { TLanguage } from "@plane/i18n";

export function createTestTranslation(actual: typeof import("@plane/i18n")) {
  // Use the established CJS ICU test boundary; the browser verifies Vite's ESM output separately.
  const webRequire = createRequire(`${process.cwd()}/package.json`);
  const require = createRequire(webRequire.resolve("@plane/i18n"));
  const { createInstance } = require("i18next");
  const ICU = require("i18next-icu").default;
  const reactI18next = require("react-i18next");
  const localeRoot = path.resolve(path.dirname(webRequire.resolve("@plane/i18n")), "../src/locales");
  const namespaces = readdirSync(path.join(localeRoot, "en")).filter((file) => file.endsWith(".json"));
  const resources = Object.fromEntries(
    actual.SUPPORTED_LANGUAGES.map(({ value }) => [
      value,
      Object.fromEntries(
        namespaces.map((file) => [
          file.slice(0, -5),
          JSON.parse(readFileSync(path.join(localeRoot, value, file), "utf8")),
        ])
      ),
    ])
  );
  const instance = createInstance().use(ICU).use(reactI18next.initReactI18next);
  const ready = instance.init({
    lng: "en",
    fallbackLng: "en",
    resources,
    defaultNS: "common",
    ns: namespaces.map((file) => file.slice(0, -5)),
    fallbackNS: namespaces.map((file) => file.slice(0, -5)),
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });
  return {
    ...actual,
    initPromise: ready,
    i18nInstance: instance,
    Trans: reactI18next.Trans,
    setLanguage: (language: TLanguage) => instance.changeLanguage(language),
    TranslationProvider: ({ children }: { children: ReactNode }) =>
      createElement(reactI18next.I18nextProvider, { i18n: instance }, children),
    useTranslation: () => {
      const { t, i18n } = reactI18next.useTranslation();
      return {
        t,
        currentLocale: i18n.language,
        direction: i18n.dir(),
        languages: actual.SUPPORTED_LANGUAGES,
        changeLanguage: (language: TLanguage) => {
          void instance.changeLanguage(language);
        },
      };
    },
  };
}
