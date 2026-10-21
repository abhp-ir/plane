/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { StarterKit } from "@tiptap/starter-kit";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { EditorContentWrapper } from "./editor-content";

it("keeps task and child controls focused while the wrapper still forwards its own focus", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const element = document.createElement("div");
  document.body.appendChild(element);
  const root = createRoot(element);
  const editor = new Editor({
    extensions: [StarterKit, TaskList, TaskItem],
    content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>می‌رود ABC-42</p></li></ul>',
  });
  const chain = vi.spyOn(editor, "chain");
  const documentBefore = editor.getJSON();
  try {
    await act(async () =>
      root.render(
        <EditorContentWrapper editor={editor} id="task-focus" tabIndex={0}>
          <button type="button">Child control</button>
        </EditorContentWrapper>
      )
    );
    const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await act(async () => checkbox.focus());
    expect(document.activeElement).toBe(checkbox);
    expect(chain).not.toHaveBeenCalled();
    await act(async () => element.querySelector("button")!.focus());
    expect(chain).not.toHaveBeenCalled();
    await act(async () => (element.firstElementChild as HTMLElement).focus());
    expect(chain).toHaveBeenCalledTimes(1);
    expect(editor.getJSON()).toEqual(documentBefore);
  } finally {
    chain.mockRestore();
    await act(async () => root.unmount());
    editor.destroy();
    element.remove();
    vi.unstubAllGlobals();
  }
});
