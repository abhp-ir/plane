/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiPicker } from "./emoji-picker";

vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "common.emoji.label": "ایموجی",
        "common.icon.label": "آیکون",
        "common.search.label": "جست‌وجو",
      };
      return labels[key] ?? key;
    },
  }),
}));

vi.mock("./emoji/emoji", () => ({
  EmojiRoot: () => <div data-testid="emoji-grid">emoji grid</div>,
}));

vi.mock("./icon/icon-root", () => ({
  IconRoot: () => <div data-testid="icon-grid">icon grid</div>,
}));

function ControlledPicker() {
  const [isOpen, setIsOpen] = useState(false);
  return <EmojiPicker isOpen={isOpen} handleToggle={setIsOpen} onChange={vi.fn()} label={<span>Pick emoji</span>} />;
}

describe("EmojiPicker popover", () => {
  it("localizes both tab names", () => {
    render(<EmojiPicker isOpen handleToggle={vi.fn()} onChange={vi.fn()} label={<span>Pick emoji</span>} />);
    expect(screen.getByRole("tab", { name: "ایموجی" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "آیکون" })).toBeDefined();
  });

  it("opens on trigger click and marks the panel as preventing outside click", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    expect(document.querySelector("[data-prevent-outside-click]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Pick emoji" }));
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
  });

  it("keeps the prevent-outside panel while open and drops it when closed", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <EmojiPicker isOpen handleToggle={handleToggle} onChange={vi.fn()} label={<span>Pick emoji</span>} />
    );
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
    rerender(
      <EmojiPicker isOpen={false} handleToggle={handleToggle} onChange={vi.fn()} label={<span>Pick emoji</span>} />
    );
    const panel = document.querySelector("[data-prevent-outside-click]");
    expect(panel == null || panel.hasAttribute("data-closed")).toBe(true);
  });
});
