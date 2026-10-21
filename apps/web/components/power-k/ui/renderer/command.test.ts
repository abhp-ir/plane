// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { Command } from "cmdk";
import { afterAll, expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import { filterPowerKCommand } from "../../core/search";
import { CommandRenderer } from "./command";

vi.mock("../pages/context-based", () => ({ CONTEXT_ENTITY_MAP: {} }));
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);
afterAll(() => {
  vi.unstubAllGlobals();
});

const command: TPowerKCommandConfig = {
  id: "open_project",
  i18n_title: "power_k.navigation_actions.open_project",
  type: "action",
  group: "navigation",
  action: vi.fn(),
  isVisible: () => true,
  isEnabled: () => true,
  closeOnSelect: true,
  keywords: ["switch project"],
};

it.each(["Open project", "switch project", "بازکردن پروژه"])(
  "finds a Persian command using %s and executes its original identity with Enter",
  async (query) => {
    await initPromise;
    await setLanguage("fa");
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onCommandSelect = vi.fn();
    try {
      await act(async () =>
        root.render(
          createElement(
            TranslationProvider,
            null,
            createElement(
              Command,
              {
                filter: filterPowerKCommand,
                ref: (el: HTMLDivElement | null) => {
                  // jsdom lacks scrolling; stub only the mounted test elements.
                  for (const item of el?.querySelectorAll<HTMLElement>("[cmdk-group-heading], [cmdk-item]") ?? []) {
                    item.scrollIntoView = vi.fn();
                  }
                },
              },
              createElement(Command.Input, { value: query, onValueChange: vi.fn() }),
              createElement(
                Command.List,
                null,
                createElement(CommandRenderer, {
                  commands: [command],
                  context: { activeContext: null } as TPowerKContext,
                  onCommandSelect,
                })
              )
            )
          )
        )
      );
      await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      const option = container.querySelector('[cmdk-item][data-value="open_project"]');
      expect(option?.textContent).toBe("بازکردن پروژه");
      expect(option?.getAttribute("data-selected")).toBe("true");
      const input = container.querySelector("input");
      expect(input).not.toBeNull();
      await act(async () => {
        input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      expect(onCommandSelect).toHaveBeenCalledWith(command);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
