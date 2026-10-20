/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise } from "@plane/i18n";
import type { CommandListInstance } from "@/helpers/tippy";
import { getSlashCommandFilteredSections } from "./command-items-list";
import { SlashCommandsMenu } from "./command-menu";

it("executes once through Tiptap, ignores composition and does not own document keys", async () => {
  await initPromise;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const createElement = document.createElement.bind(document);
  const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
    const node = createElement(tagName, options);
    node.scrollIntoView = vi.fn();
    return node;
  });
  const element = document.createElement("div");
  document.body.appendChild(element);
  const root = createRoot(element),
    ref = createRef<CommandListInstance>();
  const editor = new Editor({ extensions: [StarterKit] }),
    command = vi.fn();
  try {
    await act(async () =>
      root.render(
        <SlashCommandsMenu
          ref={ref}
          editor={editor}
          items={getSlashCommandFilteredSections({ disabledExtensions: [], flaggedExtensions: [] })({ query: "" })}
          command={command}
          range={{ from: 1, to: 2 }}
          query=""
          text="/"
          decorationNode={null}
          onClose={vi.fn()}
        />
      )
    );
    await act(async () => {
      expect(ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "Enter", isComposing: true }) })).toBe(
        false
      );
    });
    expect(command).not.toHaveBeenCalled();
    await act(async () => {
      ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "ArrowDown" }) });
    });
    await act(async () => {
      ref.current?.onKeyDown({ event: new KeyboardEvent("keydown", { key: "Enter" }) });
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(command).toHaveBeenCalledTimes(1);
    expect(command.mock.calls[0][0].key).toBe("h1");
  } finally {
    await act(async () => root.unmount());
    editor.destroy();
    element.remove();
    createElementSpy.mockRestore();
    vi.unstubAllGlobals();
  }
});
