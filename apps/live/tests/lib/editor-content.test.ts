/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import {
  generateTitleProsemirrorJson,
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getAllDocumentFormatsFromRichTextEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
  getBinaryDataFromRichTextEditorHTMLString,
  TITLE_EDITOR_EXTENSIONS,
} from "@plane/editor";

const CONTENT = [
  '<h2 style="text-align: center">عنوان فارسی ABC-42</h2>',
  '<p style="text-align: right">English paragraph with فارسی.</p>',
  "<ul><li><p>نخستین آیتم</p></li><li><p>English item</p></li></ul>",
  "<ol><li><p>آیتم شماره‌دار</p></li></ol>",
  "<blockquote><p>نقل‌قول فارسی.</p></blockquote>",
  '<pre><code>const id = "ABC-42"; // فارسی</code></pre>',
].join("");

const variants = [
  {
    name: "document",
    toBinary: getBinaryDataFromDocumentEditorHTMLString,
    fromBinary: (binary: Uint8Array) => getAllDocumentFormatsFromDocumentEditorBinaryData(binary, false),
  },
  {
    name: "rich text",
    toBinary: getBinaryDataFromRichTextEditorHTMLString,
    fromBinary: getAllDocumentFormatsFromRichTextEditorBinaryData,
  },
];

describe("editor content direction", () => {
  for (const { name, toBinary, fromBinary } of variants) {
    it(`lets each ${name} text block choose its native content direction`, () => {
      const { contentHTML, contentJSON } = fromBinary(toBinary(CONTENT));
      const blocks = contentHTML.match(/<(?:p|h2)\b[^>]*>/g);
      expect(blocks?.length).toBeGreaterThan(5);
      for (const block of blocks ?? []) expect(block).toContain('dir="auto"');
      // An auto container skips descendants that already own their direction.
      expect(contentHTML).not.toMatch(/<(?:ul|ol|li|blockquote)\b[^>]*dir="auto"/);
      const nodes = (contentJSON as JSONContent).content;
      expect(nodes?.[0].attrs?.textAlign).toBe("center");
      expect(nodes?.[1].attrs?.textAlign).toBe("right");
      expect(nodes?.find((node) => node.type === "codeBlock")?.content?.[0].text).toBe('const id = "ABC-42"; // فارسی');
      expect(contentHTML).toContain("const id = &quot;ABC-42&quot;; // فارسی");
      expect(contentHTML).not.toMatch(/<(?:pre|code)\b[^>]*dir="auto"/);
    });
  }

  it("keeps direction out of persisted node attributes and preserves the binary round trip", () => {
    const binary = getBinaryDataFromDocumentEditorHTMLString(CONTENT);
    const first = getAllDocumentFormatsFromDocumentEditorBinaryData(binary, false);
    const second = getAllDocumentFormatsFromDocumentEditorBinaryData(
      Buffer.from(first.contentBinaryEncoded, "base64"),
      false
    );
    expect(second.contentJSON).toEqual(first.contentJSON);
    expect(second.contentBinaryEncoded).toBe(first.contentBinaryEncoded);
    expect(JSON.stringify(first.contentJSON)).not.toMatch(/"(?:dir|direction)":/);
  });

  it("lets a Page title choose its content direction without changing its text", () => {
    for (const title of ["عنوان فارسی ABC-42", "ABC-42 عنوان فارسی"]) {
      // Live and editor resolve distinct ProseMirror peer types; use the real registered title extensions.
      const html = generateHTML(
        generateTitleProsemirrorJson(title),
        TITLE_EDITOR_EXTENSIONS as unknown as Parameters<typeof generateHTML>[1]
      );
      expect(html).toContain('dir="auto"');
      expect(html).toContain(title);
    }
  });
});
