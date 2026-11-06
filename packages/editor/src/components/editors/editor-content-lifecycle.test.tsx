/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor, Node as TiptapNode } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EditorContentWrapper } from "./editor-content";

const ReactFixture = TiptapNode.create({
  name: "lifecycleFixture",
  group: "block",
  atom: true,
  renderHTML: () => ["div", { "data-lifecycle-placeholder": "" }],
  addNodeView: () => ReactNodeViewRenderer(() => <NodeViewWrapper data-lifecycle-node="">React node</NodeViewWrapper>),
});

let container: HTMLDivElement;
let root: Root;
let unmounted: boolean;
let editor: Editor | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  unmounted = false;
  editor = undefined;
});

afterEach(async () => {
  if (!unmounted) await act(async () => root.unmount());
  if (editor && !editor.isDestroyed) editor.destroy();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function initializedEditor() {
  editor = new Editor({
    extensions: [StarterKit, ReactFixture],
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "قبل ABC-42" }] }, { type: "lifecycleFixture" }],
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(editor.isInitialized).toBe(true);
  editor.commands.setTextSelection(2);
  return editor;
}

it("mounts a real React node view after an initialized editor without a commit-phase flushSync", async () => {
  const instance = await initializedEditor();
  const errors = vi.spyOn(console, "error");
  const documentBefore = instance.getJSON();
  const selectionBefore = instance.state.selection.toJSON();

  await act(async () => root.render(<EditorContentWrapper editor={instance} id="lifecycle-editor" />));

  expect(container.querySelectorAll("[data-lifecycle-node]")).toHaveLength(1);
  expect(instance.getJSON()).toEqual(documentBefore);
  expect(instance.state.selection.toJSON()).toEqual(selectionBefore);
  expect(errors.mock.calls.filter(([message]) => String(message).includes("flushSync"))).toHaveLength(0);
});

it("does not initialize a node view after an immediate unmount", async () => {
  const instance = await initializedEditor();
  const createNodeViews = vi.spyOn(instance, "createNodeViews");
  const documentBefore = instance.getJSON();

  act(() => root.render(<EditorContentWrapper editor={instance} id="lifecycle-editor" />));
  act(() => root.unmount());
  unmounted = true;
  await act(async () => {
    await Promise.resolve();
  });

  expect(createNodeViews).not.toHaveBeenCalled();
  expect(instance.getJSON()).toEqual(documentBefore);
  expect(container.childElementCount).toBe(0);
});

it("does not initialize a node view after the editor is destroyed before the queued mount", async () => {
  const instance = await initializedEditor();
  const createNodeViews = vi.spyOn(instance, "createNodeViews");

  act(() => root.render(<EditorContentWrapper editor={instance} id="lifecycle-editor" />));
  instance.destroy();
  await act(async () => {
    await Promise.resolve();
  });

  expect(createNodeViews).not.toHaveBeenCalled();
  expect(instance.isDestroyed).toBe(true);
  expect(container.querySelector("[data-lifecycle-node]")).toBeNull();
});

it("initializes once per StrictMode mount and preserves content and selection across a remount", async () => {
  const instance = await initializedEditor();
  const createNodeViews = vi.spyOn(instance, "createNodeViews");
  const errors = vi.spyOn(console, "error");
  const documentBefore = instance.getJSON();
  const selectionBefore = instance.state.selection.toJSON();
  const content = (
    <StrictMode>
      <EditorContentWrapper editor={instance} id="lifecycle-editor" />
    </StrictMode>
  );

  await act(async () => root.render(content));
  expect(createNodeViews).toHaveBeenCalledTimes(1);
  expect(container.querySelectorAll("[data-lifecycle-node]")).toHaveLength(1);
  await act(async () => root.unmount());
  unmounted = true;
  root = createRoot(container);
  unmounted = false;
  await act(async () => root.render(content));

  expect(createNodeViews).toHaveBeenCalledTimes(2);
  expect(container.querySelectorAll("[data-lifecycle-node]")).toHaveLength(1);
  expect(instance.getJSON()).toEqual(documentBefore);
  expect(instance.state.selection.toJSON()).toEqual(selectionBefore);
  expect(errors.mock.calls.filter(([message]) => String(message).includes("flushSync"))).toHaveLength(0);
});
