/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { TaskList } from "@tiptap/extension-task-list";
import { StarterKit } from "@tiptap/starter-kit";
import { expect, it, vi } from "vitest";
import { i18nInstance, initPromise, setLanguage } from "@plane/i18n";
import { LocalizedTaskItem } from "./task-item";

it("updates mounted task labels on locale changes without changing content, selection or undo history", async () => {
  await initPromise;
  await setLanguage("fa");
  // Isolate the node-view binding; actual ICU rendering has separate resource and browser coverage.
  const translate = vi.spyOn(i18nInstance, "t").mockImplementation((...args) => {
    const [key, options] = args;
    const message: unknown = i18nInstance.getResource(i18nInstance.language, "editor", String(key));
    if (typeof message !== "string") throw new Error(`Missing task resource: ${String(key)}`);
    return options && typeof options === "object" && "text" in options
      ? message.replace("{text}", String(options.text))
      : message;
  });
  const update = vi.fn();
  const editor = new Editor({
    extensions: [StarterKit, TaskList, LocalizedTaskItem],
    content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>می‌رود ABC-42</p></li></ul>',
    onUpdate: update,
  });
  try {
    const checkbox = editor.view.dom.querySelector('input[type="checkbox"]')!;
    expect(checkbox.getAttribute("aria-label")).toBe("کادر انتخاب کار: می‌رود ABC-42");
    editor.commands.insertContent(" متن");
    const html = editor.getHTML(),
      document = editor.getJSON(),
      selection = editor.state.selection.toJSON();
    const taskText = editor.state.doc.firstChild!.firstChild!.firstChild!.textContent;
    update.mockClear();
    const expectLanguage = async (language: "en" | "fa") => {
      await setLanguage(language);
      expect(checkbox.getAttribute("aria-label")).toBe(
        `${language === "fa" ? "کادر انتخاب کار" : "Task checkbox"}: ${taskText}`
      );
      expect(editor.getHTML()).toBe(html);
      expect(editor.getJSON()).toEqual(document);
      expect(editor.state.selection.toJSON()).toEqual(selection);
      expect(update).not.toHaveBeenCalled();
    };
    await expectLanguage("en");
    await expectLanguage("fa");
    editor.commands.undo();
    expect(editor.getHTML()).not.toBe(html);
  } finally {
    editor.destroy();
    translate.mockRestore();
    await setLanguage("en");
  }
});
