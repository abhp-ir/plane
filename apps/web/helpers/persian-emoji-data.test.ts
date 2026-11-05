/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type EmojiRecord = {
  emoji: string;
  hexcode: string;
  label: string;
  tags: string[];
  version: number;
  group?: number;
  subgroup?: number;
  skins?: EmojiRecord[];
};

type NamedMessage = { key: string; message: string };
type Messages = {
  groups: (NamedMessage & { order: number })[];
  skinTones: NamedMessage[];
  subgroups: (NamedMessage & { order: number })[];
};

const apps = ["web", "admin", "space"] as const;
const assetFiles = ["data.json", "messages.json", "LICENSE.unicode", "LICENSE.emojibase-data"] as const;
const readAsset = (app: string, filename: string) =>
  readFileSync(new URL(`../../${app}/public/emojibase/fa/${filename}`, import.meta.url));
const digest = (contents: Uint8Array) => createHash("sha256").update(contents).digest("hex");
const data = JSON.parse(readAsset("web", "data.json").toString("utf8")) as EmojiRecord[];
const messages = JSON.parse(readAsset("web", "messages.json").toString("utf8")) as Messages;
const groupedBases = data.filter((emoji) => emoji.group !== undefined);
const groupedRecords = groupedBases.flatMap((emoji) => [emoji, ...(emoji.skins ?? [])]);
const categoryOrders = new Set(messages.groups.map((group) => group.order));
const categoryBases = data.filter((emoji) => emoji.group !== undefined && categoryOrders.has(emoji.group));
const categoryRecords = categoryBases.flatMap((emoji) => [emoji, ...(emoji.skins ?? [])]);

const literalGlyphLabels: Record<string, string> = {
  "1F191": "دکمهٔ CL",
  "1F192": "دکمهٔ COOL",
  "1F193": "دکمهٔ FREE",
  "1F195": "دکمهٔ NEW",
  "1F196": "دکمهٔ NG",
  "1F197": "دکمهٔ OK",
  "1F199": "دکمهٔ !UP",
  "1F19A": "دکمهٔ VS",
};

describe("vendored Persian emoji data", () => {
  it.each(assetFiles)("ships identical %s in all three applications", (filename) => {
    const expected = digest(readAsset("web", filename));
    for (const app of apps) expect(digest(readAsset(app, filename)), app).toBe(expected);
  });

  it.each([
    ["LICENSE.unicode", "65eb33419e22a297550a811b5b535f5e532f9a7e0114b516c0ea18afd53c3804"],
    ["LICENSE.emojibase-data", "5c4e1582dcae9429a5d00ec0a64185c3a711f9757b2308fdf275d90b120f6149"],
  ])("retains the complete pinned %s notice", (filename, expected) => {
    expect(digest(readAsset("web", filename))).toBe(expected);
  });

  it("retains the runtime 18 pool and separately classifies omitted regional indicators and components", () => {
    expect(data.filter((emoji) => emoji.group === undefined)).toEqual([]);
    expect(data.filter((emoji) => /^[\u{1F1E6}-\u{1F1FF}]$/u.test(emoji.emoji))).toEqual([]);
    expect(groupedBases).toHaveLength(1932);
    expect(groupedBases.filter((emoji) => emoji.group === 2)).toHaveLength(9);
    expect(data.flatMap((emoji) => emoji.skins ?? [])).toHaveLength(2040);
    expect(groupedRecords).toHaveLength(3972);
    expect(categoryBases).toHaveLength(1923);
    expect(categoryRecords).toHaveLength(3963);
    expect(new Set(groupedRecords.map((emoji) => emoji.emoji)).size).toBe(groupedRecords.length);
    expect(new Set(groupedRecords.map((emoji) => emoji.hexcode)).size).toBe(groupedRecords.length);
    expect(Math.max(...groupedRecords.map((emoji) => emoji.version))).toBe(18);
    expect(data.find((emoji) => emoji.hexcode === "1FAF9")).toMatchObject({
      emoji: "🫹",
      label: "شست به سمت چپ",
      version: 18,
      group: 1,
      subgroup: 19,
    });
  });

  it("uses Persian-script labels with only the eight exact official literal-glyph exceptions", () => {
    for (const emoji of groupedRecords) {
      expect(emoji.label, emoji.hexcode).toMatch(/\p{Script=Arabic}/u);
      expect(emoji.label, emoji.hexcode).not.toMatch(/↑↑↑|∅∅∅/u);
      const literal = literalGlyphLabels[emoji.hexcode];
      if (literal !== undefined) expect(emoji.label, emoji.hexcode).toBe(literal);
      else expect(emoji.label, emoji.hexcode).not.toMatch(/\p{Script=Latin}/u);
    }
    const literalIds = groupedRecords
      .filter((emoji) => /\p{Script=Latin}/u.test(emoji.label))
      .map((emoji) => emoji.hexcode);
    expect(new Set(literalIds)).toEqual(new Set(Object.keys(literalGlyphLabels)));
  });

  it("keeps Persian category and tone messages with the runtime 18 flag metadata", () => {
    expect(messages.groups.map(({ key, order }) => [key, order])).toEqual([
      ["smileys-emotion", 0],
      ["people-body", 1],
      ["animals-nature", 3],
      ["food-drink", 4],
      ["travel-places", 5],
      ["activities", 6],
      ["objects", 7],
      ["symbols", 8],
      ["flags", 9],
    ]);
    for (const { key, message } of [...messages.groups, ...messages.skinTones]) {
      expect(message, key).toMatch(/\p{Script=Arabic}/u);
      expect(message, key).not.toMatch(/\p{Script=Latin}|↑↑↑|∅∅∅/u);
    }
    expect(Object.fromEntries(messages.skinTones.map(({ key, message }) => [key, message]))).toEqual({
      dark: "پوست آبنوسی",
      light: "پوست سفید",
      medium: "پوست طلایی",
      "medium-dark": "پوست گندمی",
      "medium-light": "پوست روشن",
    });
    expect(messages.subgroups).toHaveLength(101);
    expect(messages.subgroups.find(({ key }) => key === "country-flag")?.order).toBe(98);
    expect(messages.subgroups.find(({ key }) => key === "subdivision-flag")?.order).toBe(99);
    expect(data.find((emoji) => emoji.hexcode === "1F1EE-1F1F7")).toMatchObject({ group: 9, subgroup: 98 });
  });

  it("retains Persian and English aliases, including variant names on searchable parents", () => {
    expect(data.find((emoji) => emoji.hexcode === "1F600")?.tags).toEqual(
      expect.arrayContaining(["لبخند", "grinning face"])
    );
    const thumbsUp = data.find((emoji) => emoji.hexcode === "1F44D");
    expect(thumbsUp?.tags).toEqual(
      expect.arrayContaining(["پسندیدن", "thumbs up", "پسندیدن: پوست سفید", "thumbs up: light skin tone"])
    );
    expect(thumbsUp?.skins?.find((emoji) => emoji.hexcode === "1F44D-1F3FB")?.tags).toEqual(
      expect.arrayContaining(["پسندیدن: پوست سفید", "thumbs up: light skin tone"])
    );
    expect(data.find((emoji) => emoji.hexcode === "1FAF9")?.tags).toEqual(
      expect.arrayContaining([
        "شست به سمت چپ",
        "leftwards thumb sign",
        "شست به سمت چپ: پوست سفید",
        "leftwards thumb sign: light skin tone",
      ])
    );
  });
});
