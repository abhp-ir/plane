/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { SUPPORTED_LANGUAGES } from "../src/constants/language";
import { NAMESPACES } from "../src/constants/namespaces";
import { initPromise, i18nInstance } from "../src/core/instance";
import { setLanguage } from "../src/core/set-language";

type Messages = { [key: string]: string | Messages };
function flatten(messages: Messages, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const keyPath = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string" ? [[keyPath, value]] : Object.entries(flatten(value, keyPath));
    })
  );
}
function load(language: string, namespace: string): Record<string, string> {
  return flatten(
    JSON.parse(readFileSync(path.resolve(__dirname, `../src/locales/${language}/${namespace}.json`), "utf8"))
  );
}
function variables(message: string): string[] {
  return [...message.matchAll(/\{(\w+)(?=[,}])/g)]
    .filter((match) => !/(?:\b(?:one|other|zero|two|few|many)|=\d+)\s*$/.test(message.slice(0, match.index)))
    .map((match) => match[1])
    .toSorted();
}

test("Persian is registered once as fa / فارسی", () => {
  assert.deepEqual(
    SUPPORTED_LANGUAGES.filter(({ value }) => value === "fa"),
    [{ value: "fa", label: "فارسی" }]
  );
});

test("every registered namespace has a loadable Persian resource", () => {
  for (const namespace of NAMESPACES) load("fa", namespace);
});

// Keep native Node on the ICU package's CJS export; browser integration is tested in Vite.
const translatedNamespaces = [
  "common",
  "navigation",
  "auth",
  "accessibility",
  "settings",
  "home",
  "project-settings",
  "workspace-settings",
];
for (const namespace of translatedNamespaces) {
  test(`${namespace}: exact source keys, ICU variables and markup are preserved`, () => {
    const english = load("en", namespace);
    const persian = load("fa", namespace);
    assert.deepEqual(Object.keys(persian).toSorted(), Object.keys(english).toSorted());
    for (const [key, source] of Object.entries(english)) {
      const target = persian[key];
      if (target === source && /[A-Za-z]/.test(source)) {
        assert.match(
          source,
          /^(Plane(?: AI| Pro| Runner)?|Intake|Stickies|Pro|Business|Enterprise|SSO URL|SLO URL|IdP|URL|CSV|Excel|JSON|plane\.so|name@company\.com|https:\/\/example\.com(?:\/(?:setup|webhook))?|https:\/\/example\.com https:\/\/example\.com\/)$/,
          `${key}: English filler`
        );
      }
      assert.deepEqual(variables(target), variables(source), key);
      assert.deepEqual(target.match(/<[^>]+>/g), source.match(/<[^>]+>/g), key);
      assert.equal(target.split("\n").length, source.split("\n").length, key);
      if (/\{\w+,\s*plural,/.test(target)) {
        assert.match(target, /\bone\s*\{/, `${key}: Persian one form`);
        assert.match(target, /\bother\s*\{/, `${key}: Persian other form`);
        assert.doesNotMatch(target, /\b(?:zero|two|few|many)\s*\{/, `${key}: unsupported Persian form`);
      }
      assert.ok(!/[يك]/u.test(target), `${key}: use Persian ی and ک`);
      for (const brand of [
        "Plane",
        "Intake",
        "Stickies",
        "Business",
        "Enterprise",
        "GitHub",
        "OIDC",
        "SAML",
        "SSO",
        "IdP",
        "URL",
        "API",
      ]) {
        // Business development is an ordinary job role, not the Business plan.
        if (brand === "Business" && key === "user_roles.sales_or_business_development") continue;
        if (new RegExp(`\\b${brand}\\b`).test(source)) assert.ok(target.includes(brand), `${key}: ${brand}`);
      }
    }
  });
}

test("i18next resource backend loads Persian, ICU counts, English fallback and LTR locales", async () => {
  await initPromise;
  await setLanguage("fa");
  assert.equal(i18nInstance.language, "fa");
  assert.equal(i18nInstance.dir(), "rtl");
  assert.equal(i18nInstance.t("sidebar.projects"), "پروژه‌ها");
  assert.equal(i18nInstance.t("auth.common.resend_in", { seconds: 12 }), "ارسال دوباره تا 12 ثانیهٔ دیگر");
  for (const namespace of translatedNamespaces) {
    for (const [key, message] of Object.entries(load("fa", namespace))) {
      const numericVariables = new Set(
        [...message.matchAll(/\{(\w+),\s*(?:plural|selectordinal|number)/g)].map((match) => match[1])
      );
      const params = Object.fromEntries(
        variables(message).map((variable) => [variable, numericVariables.has(variable) ? 2 : "Plane-42"])
      );
      const rendered = i18nInstance.t(key, params);
      assert.equal(typeof rendered, "string", key);
      assert.ok(!rendered.includes("{count,"), key);
      assert.ok(!rendered.match(/\{\w+\}/), key);
    }
  }
  const rules = new Intl.PluralRules("fa-IR");
  assert.deepEqual(rules.resolvedOptions().pluralCategories, ["one", "other"]);
  for (const n of [0, 0.5, 1]) assert.equal(rules.select(n), "one");
  for (const n of [1.1, 2, 5, 100]) assert.equal(rules.select(n), "other");
  for (const count of [0, 0.5, 1, 1.1, 2, 5, 100]) {
    assert.equal(i18nInstance.t("member", { count }), `${new Intl.NumberFormat("fa").format(count)} عضو`);
    assert.equal(i18nInstance.t("labels_count", { count }), `${new Intl.NumberFormat("fa").format(count)} برچسب`);
    assert.equal(
      i18nInstance.t("home.business_trial_banner.trial_ends_in_days", { days: count }),
      `دورهٔ آزمایشی تا ${new Intl.NumberFormat("fa").format(count)} روز دیگر پایان می‌یابد`
    );
  }
  const fallbackKey = Object.keys(load("en", "project"))[0];
  assert.equal(i18nInstance.t(fallbackKey), i18nInstance.t(fallbackKey, { lng: "en" }));
  assert.equal(i18nInstance.t("common.from", { name: "Plane ABC-42" }), "از Plane ABC-42");
  for (const locale of SUPPORTED_LANGUAGES) {
    if (locale.value !== "fa") assert.equal(i18nInstance.dir(locale.value), "ltr", locale.value);
  }
  await setLanguage("en");
  assert.equal(i18nInstance.dir(), "ltr");
  assert.equal(i18nInstance.t("sidebar.projects"), "Projects");
});
