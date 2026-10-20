/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { afterEach, beforeAll, expect, it } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { CustomColorExtension } from "@/extensions/custom-color";
import { getSlashCommandFilteredSections } from "./command-items-list";
import { SlashCommands } from "./root";

const items = (query: string) =>
  getSlashCommandFilteredSections({ disabledExtensions: [], flaggedExtensions: [] })({ query }).flatMap(
    (section) => section.items
  );

beforeAll(async () => {
  await initPromise;
});
afterEach(async () => {
  await setLanguage("en");
});

it("resolves current labels and Persian queries without freezing the editor language", async () => {
  const filter = getSlashCommandFilteredSections({ disabledExtensions: [], flaggedExtensions: [] });
  await setLanguage("en");
  expect(filter({ query: "paragraph" })[0].items[0].title).toBe("Text");
  await setLanguage("fa");
  expect(filter({ query: "متن" })[0].items[0].title).toBe("متن");
  expect(items("جدول").map((item) => item.key)).toContain("table");
  expect(items("كد").map((item) => item.key)).toContain("code");
  expect(items("سرتیتر ۱").map((item) => item.key)).toContain("h1");
  expect(items("فهرست شماره دار").map((item) => item.key)).toContain("numbered-list");
  expect(items("پس زمینه").map((item) => item.key)).toContain("background-color-gray");
  expect(items("پسزمینه").map((item) => item.key)).toContain("background-color-default");
  await setLanguage("en");
  expect(filter({ query: "paragraph" })[0].items[0].title).toBe("Text");
});

it("keeps English titles, descriptions and aliases searchable in Persian", async () => {
  await setLanguage("en");
  const english = items("");
  await setLanguage("fa");
  for (const item of english) {
    for (const query of [item.title, item.description, ...item.searchTerms]) {
      expect(
        items(query).map((result) => result.key),
        query
      ).toContain(item.key);
    }
  }
  expect(items("CODEBLOCK").map((item) => item.key)).toContain("code");
});

it("preserves empty/no-result behavior, disabled images and caller-owned options", async () => {
  await setLanguage("fa");
  expect(items("")).toHaveLength(35);
  expect(items(" \u200c ")).toHaveLength(35);
  expect(items("no-such-command-ABC42")).toEqual([]);
  const custom = Object.freeze({
    ...items("")[0],
    title: "Caller فارسی ABC-42",
    description: "Caller-owned description",
    key: "caller-option",
    searchTerms: ["CUSTOM"],
    section: "general" as const,
    pushAfter: "text" as const,
  });
  const filter = getSlashCommandFilteredSections({
    disabledExtensions: ["image"],
    flaggedExtensions: [],
    additionalOptions: [custom],
  });
  const all = filter({ query: "" }).flatMap((section) => section.items);
  expect(all.some((item) => item.key === "image")).toBe(false);
  expect(all[1]).toBe(custom);
  expect(filter({ query: "custom" })[0].items).toEqual([custom]);
});

it("keeps technical identities and actual heading/list/quote/code operations across languages", async () => {
  const editor = new Editor({ extensions: [StarterKit], content: "<p>/heading</p>" });
  try {
    await setLanguage("en");
    const english = items("").map(({ key, commandKey }) => ({ key, commandKey }));
    await setLanguage("fa");
    expect(items("").map(({ key, commandKey }) => ({ key, commandKey }))).toEqual(english);
    for (const [key, type] of [
      ["h1", "heading"],
      ["h6", "heading"],
      ["text", "paragraph"],
      ["numbered-list", "orderedList"],
      ["bulleted-list", "bulletList"],
      ["quote", "blockquote"],
      ["code", "codeBlock"],
    ]) {
      editor.commands.setContent("<p>/heading</p>");
      items("")
        .find((item) => item.key === key)!
        .command({ editor, range: { from: 1, to: 9 } });
      expect(editor.getJSON().content?.[0].type).toBe(type);
      expect(editor.getText()).not.toContain("/heading");
    }
  } finally {
    editor.destroy();
  }
});

it("clears background with its default command without clearing text color", async () => {
  const editor = new Editor({
    extensions: [StarterKit, CustomColorExtension],
    content: '<p><span data-text-color="green" data-background-color="peach">prefix /bg</span></p>',
  });
  try {
    editor.commands.setTextSelection(11);
    items("")
      .find((item) => item.key === "background-color-default")!
      .command({ editor, range: { from: 8, to: 11 } });
    editor.commands.insertContent("X");
    expect(editor.getText()).toBe("prefix X");
    expect(editor.getAttributes("customColor").color).toBe("green");
    expect(editor.getAttributes("customColor").backgroundColor).toBe(null);
  } finally {
    editor.destroy();
  }
});

it("disallows suggestions in code blocks and read-only editors", () => {
  const editor = new Editor({ extensions: [StarterKit], content: "<pre><code>/text</code></pre>" });
  try {
    const allow = SlashCommands({ disabledExtensions: [], flaggedExtensions: [] }).options.suggestion.allow!;
    const args = { editor, range: { from: 1, to: 6 }, state: editor.state, isActive: false };
    expect(allow(args)).toBe(false);
    editor.commands.setContent("<p>/text</p>");
    editor.commands.setTextSelection(1);
    editor.setEditable(false);
    expect(allow({ ...args, state: editor.state })).toBe(false);
  } finally {
    editor.destroy();
  }
});
