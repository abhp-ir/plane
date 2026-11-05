/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmojiRoot } from "./emoji/emoji";
import { IconRoot } from "./icon/icon-root";

vi.mock("./icon/lucide-root", () => ({ LucideIconsList: () => null }));
vi.mock("./icon/material-root", () => ({ MaterialIconList: () => null }));

describe("emoji/icon picker search fields", () => {
  it("names the icon tab search with the translated label", () => {
    render(<IconRoot defaultColor="#6d7b8a" onChange={vi.fn()} iconType="material" />);
    // Assert the explicit attribute: the accessible-name algorithm would otherwise fall back to the placeholder.
    const search = screen.getByRole("textbox", { name: "Search" });
    expect(search.getAttribute("aria-label")).toBe("Search");
    expect(search.getAttribute("placeholder")).toBe("Search");
  });

  it("names the icon tab search with the caller's placeholder", () => {
    render(<IconRoot defaultColor="#6d7b8a" onChange={vi.fn()} iconType="lucide" searchPlaceholder="Find an icon" />);
    expect(screen.getByRole("textbox", { name: "Find an icon" }).getAttribute("aria-label")).toBe("Find an icon");
  });

  it("names the emoji tab search with the translated label", () => {
    render(<EmojiRoot onChange={vi.fn()} />);
    expect(screen.getByRole("searchbox", { name: "Search" }).getAttribute("aria-label")).toBe("Search");
    expect(screen.getByRole("button", { name: "Change skin tone" }).getAttribute("aria-label")).toBe(
      "Change skin tone"
    );
  });

  it("names and focuses the hex input while preserving the technical value", async () => {
    const user = userEvent.setup();
    render(<IconRoot defaultColor="#123456" onChange={vi.fn()} iconType="lucide" />);
    const hex = screen.getByRole<HTMLInputElement>("textbox", { name: "Hex color" });
    expect(hex.value).toBe("123456");
    expect(document.activeElement).toBe(hex);
    expect(hex.closest('[dir="ltr"]')).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Hex color" }));
    expect(screen.queryByRole("textbox", { name: "Hex color" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Hex color" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Hex color" }));
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Hex color" }).value).toBe("123456");
  });
});
