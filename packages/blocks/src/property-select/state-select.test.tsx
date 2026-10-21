/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { StateSelect } from "./state-select";

it.each([
  ["fa", "جست‌وجو"],
  ["en", "Search"],
] as const)("localizes the state search dialog in %s and preserves editable state names", async (language, search) => {
  await initPromise;
  await setLanguage(language);
  const state = { id: "custom-state", name: "Working on ABC-42", color: "#123456", group: "started" as const };
  const onChange = vi.fn();
  try {
    render(
      <TranslationProvider>
        <StateSelect
          value={state}
          getValues={() => Promise.resolve({ results: [state], next_page_results: false })}
          onChange={onChange}
          variant="pill-sm"
        />
      </TranslationProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /Working on ABC-42/ }));
    expect(await screen.findByRole("combobox", { name: search })).toBeTruthy();
    expect(await screen.findByRole("listbox", { name: search })).toBeTruthy();
    expect(await screen.findByRole("option", { name: "Working on ABC-42" })).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    expect(state.name).toBe("Working on ABC-42");
  } finally {
    cleanup();
    await setLanguage("en");
  }
});
