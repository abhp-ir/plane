/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { expect, it } from "vitest";
import { getPDFTextDirection, isolatePDFCodeContent } from "./content-direction";

it("follows the first letter in Persian, English, mixed and empty blocks independently of UI language", () => {
  expect(getPDFTextDirection("۱۲۳ … می‌رود ABC-42")).toBe("rtl");
  expect(getPDFTextDirection("42 ABC فارسی")).toBe("ltr");
  expect(getPDFTextDirection("\u200cعلی‌رضا")).toBe("rtl");
  expect(getPDFTextDirection("שלום ABC")).toBe("rtl");
  expect(getPDFTextDirection("日本語 فارسی")).toBe("ltr");
  expect(getPDFTextDirection("۱۲۳ …")).toBe("ltr");
  expect(getPDFTextDirection("")).toBe("ltr");
});

it("isolates RTL code phrases while preserving source characters, ZWNJ, spaces and line boundaries", () => {
  const source = 'const نام = "می‌رود فارسی"; // ABC-42\nconst value = 123; // توضیح فارسی';
  const presentation = isolatePDFCodeContent(source);
  expect(presentation).toBe(
    'const \u2067نام\u2069 = "\u2067می‌رود فارسی\u2069"; // ABC-42\nconst value = 123; // \u2067توضیح فارسی\u2069'
  );
  expect(presentation.replace(/[\u2067\u2069]/g, "")).toBe(source);
  expect(isolatePDFCodeContent("const value = 123;\n")).toBe("const value = 123;\n");
});
