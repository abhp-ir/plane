/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

// .cts uses the ICU package's Node/CJS export; its native ESM entry has a default-import
// interoperability issue with intl-messageformat. Browser/Vite uses its bundled ESM entry.

test("saved Persian is applied before readiness; profile and logout changes stay synchronized", async () => {
  const saved = new Map([["userLanguage", "fa"]]);
  const root = { lang: "en", dir: "ltr" };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => saved.get(key),
        setItem: (key: string, value: string) => saved.set(key, value),
      },
    },
  });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: root } });
  try {
    const { initPromise, i18nInstance } = require("../src/core/instance") as typeof import("../src/core/instance");
    const { setLanguage } = require("../src/core/set-language") as typeof import("../src/core/set-language");
    assert.deepEqual(root, { lang: "fa", dir: "rtl" });
    await initPromise;
    assert.equal(i18nInstance.t("auth.common.login"), "ورود");
    await setLanguage("en");
    assert.deepEqual(root, { lang: "en", dir: "ltr" });
    assert.equal(saved.get("userLanguage"), "en");
    await setLanguage("fa");
    assert.deepEqual(root, { lang: "fa", dir: "rtl" });
    await setLanguage("ka-ge");
    assert.deepEqual(root, { lang: "ka-ge", dir: "ltr" });
    assert.equal(saved.get("userLanguage"), "ka-ge");
    await setLanguage("unsupported" as never);
    assert.deepEqual(root, { lang: "en", dir: "ltr" });
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  }
});
