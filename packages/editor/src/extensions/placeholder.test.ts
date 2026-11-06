/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { expect, it, vi } from "vitest";
import { i18nInstance, initPromise, setLanguage } from "@plane/i18n";
import { CustomPlaceholderExtension } from "./placeholder";

it("refreshes empty-block placeholders on mounted language changes without changing content or selection", async () => {
  await initPromise;
  await setLanguage("en");
  const onUpdate = vi.fn();
  const editor = new Editor({
    extensions: [StarterKit, CustomPlaceholderExtension({ placeholder: undefined, showPlaceholderOnEmpty: false })],
    content: "<h2></h2><p></p>",
    onUpdate,
  });
  editor.commands.setTextSelection(3);
  const content = editor.getJSON();
  const selection = editor.state.selection.toJSON();
  try {
    expect(editor.view.dom.querySelector("p")?.getAttribute("data-placeholder")).toBe(
      i18nInstance.t("common.press_for_commands")
    );
    await setLanguage("fa");
    editor.commands.setTextSelection(1);
    expect(editor.view.dom.querySelector("h2")?.getAttribute("data-placeholder")).toBe(
      i18nInstance.t("editor_commands.h2.title")
    );
    editor.commands.setTextSelection(3);
    expect(editor.view.dom.querySelector("p")?.getAttribute("data-placeholder")).toBe(
      i18nInstance.t("common.press_for_commands")
    );
    await setLanguage("en");
    expect(editor.getJSON()).toEqual(content);
    expect(editor.state.selection.toJSON()).toEqual(selection);
    expect(onUpdate).not.toHaveBeenCalled();
    const dispatch = vi.spyOn(editor.view, "dispatch");
    editor.destroy();
    await setLanguage("fa");
    expect(dispatch).not.toHaveBeenCalled();
  } finally {
    if (!editor.isDestroyed) editor.destroy();
    await setLanguage("en");
  }
});
