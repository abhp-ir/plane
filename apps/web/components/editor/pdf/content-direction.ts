/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function getPDFTextDirection(text: string): "rtl" | "ltr" {
  const firstLetter = text.match(/\p{Letter}/u)?.[0] ?? "";
  return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(firstLetter) ? "rtl" : "ltr";
}

export function isolatePDFCodeContent(text: string) {
  // Keep RTL phrases readable without moving surrounding code operators and quotes.
  return text.replace(
    /[\p{Script=Arabic}\p{Script=Hebrew}][\p{Script=Arabic}\p{Script=Hebrew}\p{M}\u200c\u200d]*(?:[ \t]+[\p{Script=Arabic}\p{Script=Hebrew}][\p{Script=Arabic}\p{Script=Hebrew}\p{M}\u200c\u200d]*)*/gu,
    "\u2067$&\u2069"
  );
}
