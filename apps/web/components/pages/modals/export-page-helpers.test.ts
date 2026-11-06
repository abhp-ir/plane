/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { expect, it } from "vitest";
import { getPageExportFileName, getPageExportHTML } from "./export-page-helpers";

it.each([
  ["صفحهٔ فارسی می‌رود ABC-42", "صفحهٔ-فارسی-می‌رود-abc-42"],
  ["English Page ABC-42", "english-page-abc-42"],
  ["../../نام\u202e/فایل\n", "نام-فایل"],
  ["", "page"],
  ["😀", "page"],
])("keeps a readable safe export filename for %j", (title, expected) => {
  expect(getPageExportFileName(title)).toBe(expected);
});

it("exports a literal mixed-script title while preserving the editor's rich HTML", () => {
  const title = 'می‌رود ABC-42 <b>برنامه</b> & "عنوان"';
  const content = '<p style="text-align:right"><strong>متن فارسی</strong></p>';
  expect(getPageExportHTML(title, content)).toBe(
    '<h1 class="page-title">می‌رود ABC-42 &lt;b&gt;برنامه&lt;/b&gt; &amp; &quot;عنوان&quot;</h1>' + content
  );
  expect(title).toBe('می‌رود ABC-42 <b>برنامه</b> & "عنوان"');
});
