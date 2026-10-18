/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiReactionPicker } from "./emoji-reaction-picker";
import { EmojiReactionGroup } from "./emoji-reaction";

vi.mock("../emoji-icon-picker/emoji/emoji", () => ({
  EmojiRoot: ({
    searchQuery,
    onSearchQueryChange,
    onChange,
  }: {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onChange: (emoji: string) => void;
  }) => (
    <div data-testid="emoji-grid">
      <input
        type="search"
        aria-label="Emoji search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
      />
      <button type="button" onClick={() => onChange("👍")}>
        Choose thumbs up
      </button>
    </div>
  ),
}));

function ControlledPicker({
  disabled = false,
  closeOnSelect = true,
  onChange = vi.fn(),
}: {
  disabled?: boolean;
  closeOnSelect?: boolean;
  onChange?: (emoji: string) => void;
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EmojiReactionPicker
      isOpen={isOpen}
      handleToggle={setIsOpen}
      onChange={onChange}
      disabled={disabled}
      closeOnSelect={closeOnSelect}
    />
  );
}

function ControlledReactions({ onReactionClick }: { onReactionClick: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EmojiReactionPicker isOpen={isOpen} handleToggle={setIsOpen} onChange={vi.fn()}>
      {(trigger) => (
        <EmojiReactionGroup
          role="group"
          reactions={[{ emoji: "👍", count: 2 }]}
          onReactionClick={onReactionClick}
          addButton={trigger}
        />
      )}
    </EmojiReactionPicker>
  );
}

describe("EmojiReactionPicker popover", () => {
  it("keeps the reaction count and Add reaction trigger as separate native buttons", () => {
    const { container } = render(<ControlledReactions onReactionClick={vi.fn()} />);
    expect(container.querySelector("button button")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("reacts through the count button without opening the emoji picker", async () => {
    const onReactionClick = vi.fn();
    const user = userEvent.setup();
    render(<ControlledReactions onReactionClick={onReactionClick} />);
    await user.click(within(screen.getByRole("group")).getByRole("button", { name: /^👍\s*2$/ }));
    expect(onReactionClick).toHaveBeenCalledExactlyOnceWith("👍");
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
  });

  it("opens only from the keyboard Add trigger and returns focus on Escape", async () => {
    const onReactionClick = vi.fn();
    const user = userEvent.setup();
    render(<ControlledReactions onReactionClick={onReactionClick} />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(trigger);
    const tooltip = await screen.findByRole("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toContain(tooltip.id);
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("searchbox", { name: "Emoji search" })).toBeDefined();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onReactionClick).not.toHaveBeenCalled();
  });

  it("resets search on reopening and preserves the selected API code and close policy", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledPicker onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    await user.click(trigger);
    await user.type(await screen.findByRole("searchbox", { name: "Emoji search" }), "face");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
    await user.click(trigger);
    expect((await screen.findByRole("searchbox", { name: "Emoji search" })).getAttribute("value")).toBe("");
    await user.click(screen.getByRole("button", { name: "Choose thumbs up" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("128077");
    await waitFor(() => expect(screen.queryByTestId("emoji-grid")).toBeNull());
  });

  it("keeps the picker open when closeOnSelect is false", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ControlledPicker onChange={onChange} closeOnSelect={false} />);
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    await user.click(await screen.findByRole("button", { name: "Choose thumbs up" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("128077");
    expect(screen.getByTestId("emoji-grid")).toBeDefined();
  });

  it("keeps the native Add trigger disabled when reactions are disabled", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker disabled />);
    const trigger = screen.getByRole("button", { name: "Add reaction" });
    expect(trigger.hasAttribute("disabled")).toBe(true);
    await user.click(trigger);
    expect(screen.queryByTestId("emoji-grid")).toBeNull();
  });

  it("opens on trigger click and marks the panel as preventing outside click", async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    expect(document.querySelector("[data-prevent-outside-click]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add reaction" }));
    expect(await screen.findByTestId("emoji-grid")).toBeDefined();
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
  });

  it("keeps the prevent-outside panel while open and drops it when closed", () => {
    const handleToggle = vi.fn();
    const { rerender } = render(<EmojiReactionPicker isOpen handleToggle={handleToggle} onChange={vi.fn()} />);
    expect(document.querySelector("[data-prevent-outside-click]")).not.toBeNull();
    rerender(<EmojiReactionPicker isOpen={false} handleToggle={handleToggle} onChange={vi.fn()} />);
    const panel = document.querySelector("[data-prevent-outside-click]");
    expect(panel == null || panel.hasAttribute("data-closed")).toBe(true);
  });
});
