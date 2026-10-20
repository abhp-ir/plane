/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Comparison only: preserve the original document, query and display strings.
export const normalizeSlashCommandQuery = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s\u200c]+/gu, "");

export function findSlashCommandMatch(text: string, query: string): { from: number; to: number } | undefined {
  const normalizedQuery = normalizeSlashCommandQuery(query);
  if (!normalizedQuery) return undefined;
  const index = normalizeSlashCommandQuery(text).indexOf(normalizedQuery);
  if (index < 0) return undefined;

  const offsets: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (let j = 0; j < normalizeSlashCommandQuery(text[i]).length; j++) offsets.push(i);
  }
  return { from: offsets[index], to: offsets[index + normalizedQuery.length - 1] + 1 };
}
