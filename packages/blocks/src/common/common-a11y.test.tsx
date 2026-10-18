/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { ColorPicker } from "./color-picker/color-picker";
import { DragHandle } from "./drag-handle";
import { FavoriteStar } from "./favorite-star";

describe("FavoriteStar", () => {
  it("is a named toggle that reflects the selected state", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<FavoriteStar selected={false} onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Add to favorites" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<FavoriteStar selected onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Add to favorites" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("takes the accessible name from the caller when given", () => {
    render(<FavoriteStar selected={false} onClick={vi.fn()} aria-label="Star cycle" />);
    expect(screen.getByRole("button", { name: "Star cycle" })).toBeDefined();
  });
});

describe("DragHandle", () => {
  it("names the icon-only handle and hides its glyph", () => {
    render(<DragHandle />);
    const button = screen.getByRole("button", { name: "Drag to rearrange" });
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("takes the accessible name from the caller when given", () => {
    render(<DragHandle aria-label="Reorder widget" />);
    expect(screen.getByRole("button", { name: "Reorder widget" })).toBeDefined();
  });

  it("renders no button when disabled", () => {
    render(<DragHandle disabled />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards native trigger attributes, events and ref while containing context menus", async () => {
    const ref = createRef<HTMLButtonElement>();
    const onPointerEnter = vi.fn();
    const onClick = vi.fn();
    const onContextMenu = vi.fn();
    const onParentContextMenu = vi.fn();
    render(
      <div onContextMenu={onParentContextMenu}>
        <span id="reorder-hint">Reorder this widget</span>
        <DragHandle
          ref={ref}
          id="widget-handle"
          aria-describedby="reorder-hint"
          onPointerEnter={onPointerEnter}
          onClick={onClick}
          onContextMenu={onContextMenu}
        />
      </div>
    );
    const button = screen.getByRole("button", { name: "Drag to rearrange" });
    expect(ref.current).toBe(button);
    expect(button.id).toBe("widget-handle");
    expect(button.getAttribute("aria-describedby")).toBe("reorder-hint");
    await userEvent.hover(button);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    fireEvent(button, event);
    expect(event.defaultPrevented).toBe(true);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onParentContextMenu).not.toHaveBeenCalled();
  });

  it("anchors a keyboard tooltip to one native button", async () => {
    render(
      <Tooltip label="Reorder this widget">
        <DragHandle />
      </Tooltip>
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    const button = screen.getByRole("button", { name: "Drag to rearrange" });
    await userEvent.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(document.activeElement).toBe(button);
    expect(tooltip.textContent).toBe("Reorder this widget");
    expect(button.getAttribute("aria-describedby")).toContain(tooltip.id);
  });
});

describe("ColorPicker", () => {
  it("renders a named non-submit trigger", () => {
    render(<ColorPicker value="#000000" onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open color picker" });
    expect(trigger.getAttribute("type")).toBe("button");
  });
});
