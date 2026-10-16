/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Combobox } from "@base-ui/react/combobox";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { NestedSubmenu } from "./nested-submenu";

it.each(["rtl", "ltr"] as const)("opens a nested menu with the forward arrow in %s", async (direction) => {
  render(
    <DirectionProvider direction={direction}>
      <Combobox.Root>
        <NestedSubmenu.Group>
          <NestedSubmenu id="details" trigger="Details">
            <button>Panel action</button>
          </NestedSubmenu>
        </NestedSubmenu.Group>
      </Combobox.Root>
    </DirectionProvider>
  );
  const trigger = screen.getByText("Details");
  fireEvent.keyDown(trigger, { key: direction === "rtl" ? "ArrowRight" : "ArrowLeft" });
  expect(screen.queryByText("Panel action")).toBeNull();
  fireEvent.keyDown(trigger, { key: direction === "rtl" ? "ArrowLeft" : "ArrowRight" });
  expect(await screen.findByRole("button", { name: "Panel action" })).toBeDefined();
  fireEvent.keyDown(screen.getByRole("button", { name: "Panel action" }), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("button", { name: "Panel action" })).toBeNull());
});
