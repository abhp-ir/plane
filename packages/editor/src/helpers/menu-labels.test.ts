/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { expect, it, vi } from "vitest";
import { TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS } from "@/constants/common";
import { getEditorMenuItemLabel } from "./menu-labels";

it("resolves every built-in toolbar label without changing command identity or metadata", () => {
  const before = JSON.stringify({ TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS });
  const items = [
    ...Object.values(TOOLBAR_ITEMS).flatMap((groups) => Object.values(groups).flat()),
    ...TYPOGRAPHY_ITEMS,
  ];
  for (const item of items) {
    expect(getEditorMenuItemLabel(item.renderKey, item.name, (key) => key)).toMatch(/^(editor_|image_upload\.)/);
  }
  expect(JSON.stringify({ TOOLBAR_ITEMS, TYPOGRAPHY_ITEMS })).toBe(before);
});

it("uses the current translator on each render and leaves arbitrary custom labels untouched", () => {
  let label = "پررنگ";
  const translate = vi.fn(() => label);
  expect(getEditorMenuItemLabel("bold", "Bold", translate)).toBe("پررنگ");
  label = "Bold";
  expect(getEditorMenuItemLabel("bold", "Bold", translate)).toBe("Bold");
  label = "پررنگ";
  expect(getEditorMenuItemLabel("bold", "Bold", translate)).toBe("پررنگ");
  translate.mockClear();
  for (const key of ["custom", "constructor", "__proto__"]) {
    expect(getEditorMenuItemLabel(key, "Custom ABC-42 می‌رود", translate)).toBe("Custom ABC-42 می‌رود");
  }
  expect(translate).not.toHaveBeenCalled();
});
