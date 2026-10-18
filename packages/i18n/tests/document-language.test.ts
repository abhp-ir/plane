/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { SUPPORTED_LANGUAGES, getRegisteredLanguage } from "../src/constants/language";
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

test("canonical and saved casing resolve only to registered locale identifiers", () => {
  for (const { value } of SUPPORTED_LANGUAGES) {
    assert.equal(getRegisteredLanguage(Intl.getCanonicalLocales(value)[0]), value);
    assert.equal(getRegisteredLanguage(value.toUpperCase()), value);
  }
  for (const invalid of [undefined, null, {}, 42, "", "not-a-language", "fa-unknown"]) {
    assert.equal(getRegisteredLanguage(invalid), undefined);
  }
});

test("canonical regional tags retain the registered identifier in the document and storage", () => {
  installBrowser();
  browser.set("userLanguage", "ka-GE");
  assert.equal(getStoredLanguage(), "ka-ge");
  syncDocumentLanguage("ka-GE", "ltr");
  assert.deepEqual(root, { lang: "ka-ge", dir: "ltr" });
  assert.equal(browser.get("userLanguage"), "ka-ge");
});

test("unavailable storage cannot prevent language/direction updates", () => {
  installBrowser(true);
  assert.equal(getStoredLanguage(), "en");
  assert.doesNotThrow(() => syncDocumentLanguage("fa", "rtl"));
  assert.deepEqual(root, { lang: "fa", dir: "rtl" });
});
