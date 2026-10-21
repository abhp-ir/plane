/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { i18nInstance } from "@plane/i18n";
import { EInboxIssueSource } from "@plane/types";
import { ActivitySentence } from "./sentence";
import { ActivityPropertyChange } from "./property-change";
import { WorkItemActivityChange } from "./work-item-change";
import { ActivityCollectionChange } from "./collection-change";

vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned" }) }));

vi.mock("@plane/i18n", async () => {
  const { createRequire } = await import("node:module");
  // Keep the installed ICU package on its CJS boundary; real Vite/browser evidence is separate.
  const require = createRequire(new URL("../../../../../packages/i18n/package.json", import.meta.url));
  const { createInstance } = require("i18next") as { createInstance: () => typeof i18nInstance };
  const ICU = require("i18next-icu").default;
  const instance = createInstance();
  await instance.use(ICU).init({
    lng: "fa",
    fallbackLng: "en",
    resources: {
      fa: { translation: (await import("../../../../../packages/i18n/src/locales/fa/common.json")).default },
      en: { translation: (await import("../../../../../packages/i18n/src/locales/en/common.json")).default },
    },
    interpolation: { escapeValue: false },
  });
  return {
    i18nInstance: instance,
    Trans: require("react-i18next").Trans,
    useTranslation: () => ({ currentLocale: instance.language, t: instance.getFixedT(instance.language) }),
  };
});

const actor = createElement("a", { href: "/owned/profile/actor" }, createElement("bdi", null, "نگار ABC-42"));
const issue = createElement("a", { href: "/owned/browse/FA1405-1" }, createElement("bdi", null, "FA1405-1"));
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

afterEach(async () => {
  await i18nInstance.changeLanguage("fa");
});

it("orders a Persian property sentence around its original rich actor, issue and custom value", () => {
  const value = "Custom English review <script> می‌رود";
  const markup = renderToStaticMarkup(
    createElement(ActivityPropertyChange, {
      actor,
      issue,
      activity: { field: "state", new_value: value },
    })
  );
  expect(text(markup)).toBe(
    "نگار ABC-42 در FA1405-1، وضعیت را به Custom English review &lt;script&gt; می‌رود تغییر داد."
  );
  expect(markup).toContain('href="/owned/profile/actor"');
  expect(markup).toContain('href="/owned/browse/FA1405-1"');
  expect(markup).toContain('<bdi class="font-medium text-primary">Custom English review &lt;script&gt; می‌رود</bdi>');
  expect(value).toBe("Custom English review <script> می‌رود");
});

it("treats only the fixed priority code as a translated enum and preserves editable state names", () => {
  const priority = text(
    renderToStaticMarkup(
      createElement(ActivityPropertyChange, {
        actor,
        activity: { field: "priority", new_value: "high" },
      })
    )
  );
  const state = text(
    renderToStaticMarkup(
      createElement(ActivityPropertyChange, {
        actor,
        activity: { field: "state", new_value: "high" },
      })
    )
  );
  expect(priority).toBe("نگار ABC-42 اولویت را به بالا تغییر داد.");
  expect(state).toBe("نگار ABC-42 وضعیت را به high تغییر داد.");
});

it("uses a real Jalali date and a complete removal sentence without changing canonical data", () => {
  const activity = { field: "target_date", new_value: "2025-03-21" };
  const before = { ...activity };
  const set = text(renderToStaticMarkup(createElement(ActivityPropertyChange, { actor, activity })));
  expect(set).toContain("۱۴۰۴");
  expect(set).toContain("فروردین");
  expect(set.slice("نگار ABC-42 ".length)).not.toMatch(/[0-9]/);
  expect(activity).toEqual(before);
  const removed = text(
    renderToStaticMarkup(
      createElement(ActivityPropertyChange, {
        actor,
        issue,
        activity: { field: "start_date", new_value: null },
      })
    )
  );
  expect(removed).toBe("نگار ABC-42 در FA1405-1، تاریخ شروع را حذف کرد.");
});

it("renders description, creation sources and deletion as contextual sentences", () => {
  expect(
    text(renderToStaticMarkup(createElement(ActivitySentence, { actor, issue, message: "description_edited" })))
  ).toBe("نگار ABC-42 توضیحاتِ FA1405-1 را ویرایش کرد.");
  for (const [source, expected] of [
    [EInboxIssueSource.EMAIL, "ایمیل"],
    [EInboxIssueSource.FORMS, "فرم‌ها"],
  ] as const) {
    const markup = renderToStaticMarkup(
      createElement(WorkItemActivityChange, {
        actor,
        issue,
        activity: { verb: "created", source_data: { source } },
      })
    );
    expect(text(markup)).toBe(`نگار ABC-42 FA1405-1 را از طریق ${expected} ایجاد کرد.`);
  }
  expect(
    text(
      renderToStaticMarkup(
        createElement(WorkItemActivityChange, {
          actor,
          activity: { verb: "created", source_data: { source: EInboxIssueSource.IN_APP } },
        })
      )
    )
  ).toBe("نگار ABC-42 آیتم کاری را ایجاد کرد.");
  expect(
    text(
      renderToStaticMarkup(
        createElement(WorkItemActivityChange, {
          actor,
          issue,
          activity: { verb: "deleted" },
        })
      )
    )
  ).toBe("نگار ABC-42 FA1405-1 را حذف کرد.");
});

it("preserves English sentence order and rich links after a locale change", async () => {
  await i18nInstance.changeLanguage("en");
  expect(
    text(
      renderToStaticMarkup(
        createElement(ActivityPropertyChange, {
          actor,
          issue,
          activity: { field: "priority", new_value: "high" },
        })
      )
    )
  ).toBe("نگار ABC-42 changed “Priority” on FA1405-1 to High.");
});

it.each([undefined, null, "custom", "toString"])("ignores an unrecognized property field %s", (field) => {
  expect(
    renderToStaticMarkup(
      createElement(ActivityPropertyChange, {
        actor,
        activity: { field, new_value: "Unchanged" },
      })
    )
  ).toBe("");
});

it.each(["cycles", "modules"])("preserves recorded %s names and IDs for assignment, update and removal", (field) => {
  const activity = {
    field,
    project: "project-id",
    verb: "created",
    old_identifier: "old-id",
    new_identifier: "new-id",
    old_value: "Old English نامِ قدیمی <code>",
    new_value: "New English نامِ جدید",
  };
  for (const verb of ["created", "updated", "deleted"]) {
    const input = { ...activity, verb };
    const before = { ...input };
    const markup = renderToStaticMarkup(createElement(ActivityCollectionChange, { actor, issue, activity: input }));
    const removed = verb === "deleted";
    expect(markup).toContain(`href="/owned/projects/project-id/${field}/${removed ? "old-id" : "new-id"}"`);
    expect(text(markup)).toContain(removed ? "Old English نامِ قدیمی &lt;code&gt;" : activity.new_value);
    expect(text(markup)).not.toContain(removed ? activity.new_value : "Old English");
    expect(text(markup)).toContain(field === "cycles" ? "چرخهٔ" : "ماژولِ");
    expect(text(markup)).toContain(removed ? "حذف کرد." : "اختصاص داد.");
    expect(input).toEqual(before);
  }
});

it("ignores a non-collection field instead of treating its editable name as a collection", () => {
  expect(
    renderToStaticMarkup(
      createElement(ActivityCollectionChange, {
        actor,
        activity: { field: "state", verb: "created", project: "project-id", new_value: "cycles" },
      })
    )
  ).toBe("");
});
