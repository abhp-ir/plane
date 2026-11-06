/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import type { Editor } from "@tiptap/core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { ImageUploadStatus } from "./upload-status";

const status = vi.hoisted(() => ({ value: 42 as number | undefined }));
vi.mock("@tiptap/react", () => ({ useEditorState: () => status.value }));

it("localizes progress digits and percent while preserving numeric accessibility values", async () => {
  await initPromise;
  await setLanguage("fa");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<ImageUploadStatus editor={{} as Editor} nodeId="owned-image" />));
    await act(async () => vi.advanceTimersByTime(5000));
    const progress = host.querySelector('[role="progressbar"]')!;
    expect(progress.getAttribute("aria-valuenow")).toBe("42");
    expect(progress.textContent).toBe("۴۲٪");
    expect(progress.getAttribute("aria-label")).toBeTruthy();
    await act(async () => setLanguage("en"));
    expect(progress.textContent).toBe("42%");
    expect(progress.getAttribute("aria-valuenow")).toBe("42");
    status.value = undefined;
    await act(async () => root.render(<ImageUploadStatus editor={{} as Editor} nodeId="owned-image" />));
    expect(host.querySelector('[role="progressbar"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    status.value = 42;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    await setLanguage("en");
  }
});
