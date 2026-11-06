/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
const LABEL_KEYS: Record<string, string> = {
  multiple: "editor_toolbar.multiple",
  bold: "editor_toolbar.bold",
  italic: "editor_toolbar.italic",
  underline: "editor_toolbar.underline",
  strikethrough: "editor_toolbar.strikethrough",
  "text-align-left": "editor_toolbar.align_left",
  "text-align-center": "editor_toolbar.align_center",
  "text-align-right": "editor_toolbar.align_right",
  text: "editor_commands.text.title",
  h1: "editor_commands.h1.title",
  h2: "editor_commands.h2.title",
  h3: "editor_commands.h3.title",
  h4: "editor_commands.h4.title",
  h5: "editor_commands.h5.title",
  h6: "editor_commands.h6.title",
  "bulleted-list": "editor_commands.bulleted-list.title",
  "numbered-list": "editor_commands.numbered-list.title",
  "to-do-list": "editor_commands.to-do-list.title",
  quote: "editor_commands.quote.title",
  code: "editor_commands.code.title",
  table: "editor_commands.table.title",
  image: "image_upload.alt",
};

export function getEditorMenuItemLabel(key: string, fallback: string, translate: (key: string) => string) {
  return Object.hasOwn(LABEL_KEYS, key) ? translate(LABEL_KEYS[key]) : fallback;
}
