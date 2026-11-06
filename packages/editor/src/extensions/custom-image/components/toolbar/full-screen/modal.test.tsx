/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ImageFullScreenModal } from "./modal";

it("focuses the image dialog, cycles its buttons and restores the trigger on close", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  const portal = document.createElement("div");
  portal.id = "editor-portal";
  const trigger = document.createElement("button");
  document.body.append(host, portal, trigger);
  trigger.focus();
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <ImageFullScreenModal
          aspectRatio={1}
          downloadSrc="data:image/png;base64,"
          isFullScreenEnabled
          isTouchDevice={false}
          src="data:image/png;base64,"
          toggleFullScreenMode={() => {}}
          width="100px"
        />
      )
    );
    const dialog = portal.querySelector('[role="dialog"]')!;
    const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])")];
    expect(document.activeElement).toBe(buttons[0]);
    buttons.at(-1)!.focus();
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", cancelable: true })));
    expect(document.activeElement).toBe(buttons[0]);
    await act(async () =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true }))
    );
    expect(document.activeElement).toBe(buttons.at(-1));
    expect(dialog.querySelector("img")?.getAttribute("alt")).toBeTruthy();
  } finally {
    await act(async () => root.unmount());
    expect(document.activeElement).toBe(trigger);
    host.remove();
    portal.remove();
    trigger.remove();
    vi.unstubAllGlobals();
  }
});
