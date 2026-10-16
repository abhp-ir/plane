/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getStoredLanguage, syncDocumentLanguage } from "../src/core/document-language";

const browser = new Map<string, string>();
const root = { lang: "en", dir: "ltr" };

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  browser.clear();
});

function installBrowser(storageBlocked = false) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => {
          if (storageBlocked) throw new Error("Storage denied");
          return browser.get(key) ?? null;
        },
        setItem: (key: string, value: string) => {
          if (storageBlocked) throw new Error("Storage denied");
          browser.set(key, value);
        },
      },
    },
  });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: root } });
}

test("server-side rendering needs no browser globals", () => {
  assert.equal(getStoredLanguage(), "en");
  assert.doesNotThrow(() => syncDocumentLanguage("en", "ltr"));
});

test("restores only registered saved languages", () => {
  installBrowser();
  assert.equal(getStoredLanguage(), "en");
  browser.set("userLanguage", "fa");
  assert.equal(getStoredLanguage(), "fa");
  browser.set("userLanguage", "not-a-language");
  assert.equal(getStoredLanguage(), "en");
});

test("document and saved preference switch together, including back to LTR", () => {
  installBrowser();
  syncDocumentLanguage("fa", "rtl");
  assert.deepEqual(root, { lang: "fa", dir: "rtl" });
  assert.equal(getStoredLanguage(), "fa");
  syncDocumentLanguage("en", "ltr");
  assert.deepEqual(root, { lang: "en", dir: "ltr" });
  assert.equal(getStoredLanguage(), "en");
});

test("unavailable storage cannot prevent language/direction updates", () => {
  installBrowser(true);
  assert.equal(getStoredLanguage(), "en");
  assert.doesNotThrow(() => syncDocumentLanguage("fa", "rtl"));
  assert.deepEqual(root, { lang: "fa", dir: "rtl" });
});
