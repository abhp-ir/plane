/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
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

test("icon picker actions and tabs are translated in every supported locale", async () => {
  await initPromise;
  const keys = ["common.icon.label", "common.emoji.label", "common.icon.add", "common.icon.change"];
  const english = load("en", "common");

  try {
    for (const { value: language } of SUPPORTED_LANGUAGES) {
      const messages = load(language, "common");
      // eslint-disable-next-line no-await-in-loop -- Locale switches share one instance and must finish in order.
      await setLanguage(language);
      for (const key of keys) {
        assert.ok(messages[key]?.trim(), `${language}: ${key}`);
        assert.equal(i18nInstance.t(key), messages[key], `${language}: render ${key}`);
        assert.deepEqual(variables(messages[key]), variables(english[key]));
      }
      if (language !== "en") {
        for (const key of ["common.icon.add", "common.icon.change"]) assert.notEqual(messages[key], english[key]);
      }
    }
  } finally {
    await setLanguage("en");
  }

  assert.deepEqual(
    keys.map((key) => load("fa", "common")[key]),
    ["آیکون", "ایموجی", "افزودن آیکون", "تغییر آیکون"]
  );
});

test("every registered namespace has a loadable Persian resource", () => {
  for (const namespace of NAMESPACES) load("fa", namespace);
});

test("sidebar and checklist labels resolve after switching languages", async () => {
  await initPromise;
  const sidebarKeys = [
    "sidebar.more",
    "sidebar.hide",
    "sidebar.main_sidebar",
    "sidebar.resize_sidebar",
    "sidebar.peek_view",
  ];
  try {
    for (const { value: language } of SUPPORTED_LANGUAGES) {
      // eslint-disable-next-line no-await-in-loop -- One shared locale instance.
      await setLanguage(language);
      const navigation = load(language, "navigation");
      const editor = load(language, "editor");
      for (const key of sidebarKeys) assert.equal(i18nInstance.t(key), navigation[key], `${language}: ${key}`);
      assert.equal(
        i18nInstance.t("editor_commands.task_checkbox", { text: "ABC-42" }),
        editor["editor_commands.task_checkbox"].replace("{text}", "ABC-42")
      );
    }
    for (const language of ["fa", "en", "fa"]) {
      // eslint-disable-next-line no-await-in-loop -- Verify live resource reactivity.
      await setLanguage(language);
      assert.equal(i18nInstance.t("sidebar.projects"), language === "fa" ? "پروژه‌ها" : "Projects");
      assert.equal(i18nInstance.t("sidebar.more"), language === "fa" ? "بیشتر" : "More");
      assert.equal(
        i18nInstance.t("editor_commands.task_checkbox", { text: "می‌رود ABC-42" }),
        language === "fa" ? "کادر انتخاب کار: می‌رود ABC-42" : "Task checkbox: می‌رود ABC-42"
      );
    }
  } finally {
    await setLanguage("en");
  }
});

test("fixed state-group vocabulary follows live Persian and English language selection", async () => {
  await initPromise;
  const persian = {
    backlog: "بک‌لاگ",
    unstarted: "شروع‌نشده",
    started: "در حال انجام",
    completed: "تکمیل‌شده",
    cancelled: "لغوشده",
  };
  try {
    for (const language of ["fa", "en", "fa"]) {
      // eslint-disable-next-line no-await-in-loop -- One shared locale instance.
      await setLanguage(language);
      const resources = load(language, "workspace");
      for (const [group, label] of Object.entries(persian)) {
        const key = `workspace_projects.state.${group}`;
        assert.equal(i18nInstance.t(key), language === "fa" ? label : resources[key]);
      }
    }
  } finally {
    await setLanguage("en");
  }
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
  "workspace",
  "empty-state",
  "project",
  "cycle",
  "module",
  "page",
  "work-item",
  "inbox",
  "editor",
  "notification",
  "power-k",
  "tour",
  "stickies",
  "update",
  "work-item-type",
  "workflow",
  "integration",
  "automation",
  "template",
  "wiki",
];

// Protocol examples and product names must stay exact, including ASCII identifiers.
const exactTechnicalValues: Record<string, string> = {
  "work_item_type_hierarchy.break_hierarchy_modal.confirm_input.placeholder": "Confirm",
  "github_integration.name": "GitHub",
  "gitlab_integration.name": "GitLab",
  "gitlab_enterprise_integration.name": "GitLab Enterprise",
  "slack_integration.name": "Slack",
  "sentry_integration.name": "Sentry",
  "bitbucket_dc_integration.name": "Bitbucket Data Center",
  "oauth_bridge_integration.name": "OAuth Bridge",
  "github_enterprise_integration.name": "GitHub Enterprise",
  "oauth_bridge_integration.provider_form.issuer_placeholder": "https://login.microsoftonline.com/tenant-id/v2.0",
  "oauth_bridge_integration.provider_form.jwks_url_placeholder":
    "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
  "oauth_bridge_integration.provider_form.jwks_url_label": "JWKS URL",
  "oauth_bridge_integration.provider_form.audience_placeholder": "api://my-app-id",
  "oauth_bridge_integration.provider_form.user_claims_placeholder": "email, preferred_username, upn",
  "oauth_bridge_integration.provider_form.rate_limit_placeholder": "120/minute",
  "automations.trigger.schedule.am": "AM",
  "automations.trigger.schedule.pm": "PM",
  "automations.trigger.schedule.schedule_mode_cron": "Cron",
  "automations.trigger.schedule.cron_expression_placeholder": "0 9 * * 1-5",
  "automations.trigger.schedule.main_content_cron_summary": "{description} ({timezone}).",
  "templates.settings.form.publish.website.placeholder": "https://plane.so",
  "templates.settings.form.publish.company_name.placeholder": "Plane",
  "templates.settings.form.publish.contact_email.placeholder": "help@plane.so",
  "templates.settings.form.publish.privacy_policy_url.placeholder": "https://planes.so/privacy-policy",
  "templates.settings.form.publish.terms_of_service_url.placeholder": "https://planes.so/terms-of-use",
};
for (const namespace of translatedNamespaces) {
  test(`${namespace}: exact source keys, ICU variables and markup are preserved`, () => {
    const english = load("en", namespace);
    const persian = load("fa", namespace);
    assert.deepEqual(Object.keys(persian).toSorted(), Object.keys(english).toSorted());
    for (const [key, source] of Object.entries(english)) {
      const target = persian[key];
      if (Object.hasOwn(exactTechnicalValues, key)) assert.equal(target, exactTechnicalValues[key], key);
      if (target === source && /[A-Za-z]/.test(source) && !Object.hasOwn(exactTechnicalValues, key)) {
        assert.match(
          source,
          /^(Plane(?: AI| Pro| Runner)?|Pro|Business|Enterprise|SSO URL|SLO URL|IdP|ID|URL|CSV|Excel|JSON|plane\.so|name@company\.com|https:\/\/example\.com(?:\/(?:setup|webhook))?|https:\/\/example\.com https:\/\/example\.com\/)$/,
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
        "Plane AI",
        "Power K",
        "PQL",
        "Active Cycles",
        "Business",
        "Enterprise",
        "GitHub",
        "GitLab",
        "Slack",
        "Sentry",
        "Bitbucket Data Center",
        "OAuth Bridge",
        "Azure AD",
        "Okta",
        "YouTube",
        "Figma",
        "Google Docs",
        "OIDC",
        "OAuth",
        "JWT",
        "JWKS",
        "HTTPS",
        "TTL",
        "Base64",
        "PR",
        "MR",
        "DMs",
        "JSON Web Key Set",
        "Cron",
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
      // Explicit Persian terminology decision; other locales retain the DNT feature names.
      assert.doesNotMatch(target, /\b(?:Sticky|Stickies|Intake)\b/, `${key}: approved Persian feature terms`);
      if (/\bStick(?:y|ies)\b/i.test(source)) assert.ok(target.includes("یادداشت"), `${key}: Sticky terminology`);
      if (/\bIntake\b/.test(source)) assert.ok(target.includes("درخواست"), `${key}: Intake terminology`);
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
  // Confirmation tokens, technical examples and opaque compositions stay exact.
  for (const [key, value] of Object.entries(exactTechnicalValues)) assert.equal(i18nInstance.t(key), value, key);
  assert.ok(i18nInstance.t("work_item_type_hierarchy.break_hierarchy_modal.confirm_input.label").includes("Confirm"));
  assert.ok(i18nInstance.t("work_item_types.settings.properties.formula.tooltip").includes("{Field Name}"));
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
    assert.equal(
      i18nInstance.t("workspace.members_import.summary.message.success", { count, plural: count === 1 ? "" : "s" }),
      `تعداد ${new Intl.NumberFormat("fa").format(count)} عضو با موفقیت به فضای کاری افزوده شد.`
    );
    for (const plural of ["", "s"]) {
      assert.equal(
        i18nInstance.t("project.members_import.summary.message.success", { count, plural }),
        `تعداد ${new Intl.NumberFormat("fa").format(count)} عضو با موفقیت به پروژه افزوده شد.`
      );
    }
    assert.equal(i18nInstance.t("cycle.label", { count }), count <= 1 ? "چرخه" : "چرخه‌ها");
    assert.equal(i18nInstance.t("module.label", { count }), count <= 1 ? "ماژول" : "ماژول‌ها");
    assert.equal(i18nInstance.t("issue.label", { count }), count <= 1 ? "آیتم کاری" : "آیتم‌های کاری");
    assert.equal(i18nInstance.t("epic.label", { count }), count <= 1 ? "اپیک" : "اپیک‌ها");
    assert.equal(
      i18nInstance.t("inbox_issue.status.snoozed.description", { days: count }),
      `${new Intl.NumberFormat("fa").format(count)} روز باقی مانده است`
    );
    assert.equal(
      i18nInstance.t("updates.progress.comments", { count }),
      `${new Intl.NumberFormat("fa").format(count)} دیدگاه`
    );
    assert.equal(
      i18nInstance.t("workflows.workflow_states.state_change_count", { count }),
      `${new Intl.NumberFormat("fa").format(count)} تغییر وضعیت مجاز`
    );
    assert.equal(
      i18nInstance.t("workflows.workflow_states.movers_count", { count }),
      `${new Intl.NumberFormat("fa").format(count)} بازبین فهرست‌شده`
    );
    assert.equal(
      i18nInstance.t("automations.action.configuration.change_property.placeholders.property_value_select", { count }),
      count <= 1 ? "مقدار را انتخاب کنید" : "مقادیر را انتخاب کنید"
    );
    assert.equal(
      i18nInstance.t("wiki_collections.delete_modal.page_count", { pageCount: count }),
      `این مجموعه ${new Intl.NumberFormat("fa").format(count)} صفحه دارد. مشخص کنید با آن‌ها چه شود.`
    );
    assert.equal(
      i18nInstance.t("wiki_collections.add_existing_page_modal.success_message", { count }),
      `${new Intl.NumberFormat("fa").format(count)} صفحه به مجموعه اضافه شد.`
    );
  }
  for (const isPublished of [true, "true"]) {
    assert.equal(i18nInstance.t("templates.settings.form.publish.action", { isPublished }), "تنظیمات انتشار");
  }
  for (const isPublished of [false, "false", "unknown"]) {
    assert.equal(i18nInstance.t("templates.settings.form.publish.action", { isPublished }), "انتشار در بازارچه");
  }
  assert.equal(
    i18nInstance.t("automations.trigger.schedule.main_content_cron_summary", {
      description: "Cron-42",
      timezone: "UTC+03:30",
    }),
    "Cron-42 (UTC+03:30)."
  );
  assert.equal(
    i18nInstance.t("templates.delete_confirmation.description.prefix") +
      "Plane-42" +
      i18nInstance.t("templates.delete_confirmation.description.suffix"),
    "آیا مطمئن هستید که می‌خواهید الگوی Plane-42 را حذف کنید؟ همهٔ داده‌های مرتبط با این الگو برای همیشه حذف می‌شوند. این کار برگشت‌پذیر نیست."
  );
  assert.equal(
    i18nInstance.t("templates.unpublish_confirmation.description.prefix") +
      "Plane-42" +
      i18nInstance.t("templates.unpublish_confirmation.description.suffix"),
    "آیا مطمئن هستید که می‌خواهید انتشار الگوی Plane-42 را لغو کنید؟ این الگو دیگر در دسترس کاربران بازارچه نخواهد بود."
  );
  assert.equal(i18nInstance.t("common.from", { name: "Plane ABC-42" }), "از Plane ABC-42");
  for (const locale of SUPPORTED_LANGUAGES) {
    if (locale.value !== "fa") assert.equal(i18nInstance.dir(locale.value), "ltr", locale.value);
  }
  await setLanguage("en");
  assert.equal(i18nInstance.dir(), "ltr");
  assert.equal(i18nInstance.t("sidebar.projects"), "Projects");
});

test("English fallback works with a missing Persian bundle", async () => {
  await initPromise;
  // Isolate ICU's memoized results from the complete real Persian resources.
  const fallback = createInstance().use(ICU);
  await fallback.init({
    ...i18nInstance.options,
    lng: "fa",
    ns: ["navigation"],
    defaultNS: "navigation",
    fallbackNS: [],
    resources: { en: { navigation: i18nInstance.getResourceBundle("en", "navigation") } },
  });
  assert.equal(fallback.language, "fa");
  assert.equal(fallback.dir(fallback.language), "rtl");
  assert.equal(fallback.t("sidebar.home"), "Home");
  assert.equal(fallback.hasResourceBundle("fa", "navigation"), false);
});
