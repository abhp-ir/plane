// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { useTableKeyboardNavigation } from "./use-table-keyboard-navigation";

it("moves focus in the physical arrow direction across locale changes and activates cells with Enter or Space", async () => {
  await initPromise;
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const click = vi.fn();
  function Table() {
    const onKeyDown = useTableKeyboardNavigation();
    return createElement(
      "table",
      { onKeyDown },
      createElement(
        "tbody",
        null,
        createElement(
          "tr",
          null,
          createElement(
            "td",
            { tabIndex: 0 },
            createElement("button", { className: "clickable", onClick: click }, "ABC-42")
          ),
          createElement("td", { tabIndex: 0 }, "Middle"),
          createElement("td", { tabIndex: 0 }, "End")
        ),
        createElement(
          "tr",
          null,
          createElement("td", { tabIndex: 0 }, "Second row"),
          createElement("td", { tabIndex: 0 }, "Middle"),
          createElement("td", { tabIndex: 0 }, "End")
        )
      )
    );
  }
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const press = (key: string) =>
    container.ownerDocument.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
    );
  try {
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(Table))));
    container.querySelectorAll("td").forEach((cell) => {
      cell.scrollIntoView = vi.fn();
    });
    const firstRow = container.querySelector("tr")!;
    const cells = firstRow.querySelectorAll("td");
    const check = async (language: "fa" | "en", leftIndex: number) => {
      await act(async () => setLanguage(language));
      cells[1].focus();
      press("ArrowLeft");
      expect(document.activeElement).toBe(cells[leftIndex]);
      press("ArrowRight");
      expect(document.activeElement).toBe(cells[1]);
    };
    await check("fa", 2);
    await check("en", 0);
    await check("fa", 2);
    press("ArrowDown");
    expect(document.activeElement).toBe(container.querySelectorAll("tr")[1].children[1]);
    press("ArrowUp");
    expect(document.activeElement).toBe(cells[1]);
    cells[0].focus();
    press(" ");
    press("Enter");
    expect(click).toHaveBeenCalledTimes(2);
    expect(cells[0].textContent).toBe("ABC-42");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
