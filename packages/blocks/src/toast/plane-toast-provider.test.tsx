/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { PlaneToastProvider } from "./plane-toast-provider";
import { dismissToast, setToast } from "./toast-manager";

it("reacts to fa→en→fa with one named viewport and preserves its queue, children and close behavior", async () => {
  await initPromise;
  await setLanguage("fa");
  const user = userEvent.setup();
  const view = render(
    <TranslationProvider>
      <PlaneToastProvider>
        <input aria-label="Retained draft" />
      </PlaneToastProvider>
    </TranslationProvider>
  );
  let id: string | undefined;
  try {
    const draft = screen.getByRole("textbox", { name: "Retained draft" });
    await user.type(draft, "می‌رود ABC-42");
    act(() => {
      id = setToast({ type: "info", title: "Payload ABC-42" });
    });
    await screen.findByText("Payload ABC-42");
    const checkLanguage = async (language: "fa" | "en") => {
      await act(async () => setLanguage(language));
      expect(screen.getAllByRole("region", { name: language === "fa" ? "اعلان‌ها" : "Notifications" })).toHaveLength(1);
      expect(screen.getByText("Payload ABC-42")).toBeDefined();
      await user.hover(screen.getByRole("region", { name: language === "fa" ? "اعلان‌ها" : "Notifications" }));
      expect(screen.getByRole("button", { name: language === "fa" ? "بستن" : "Close" })).toBeDefined();
      expect(draft).toBe(screen.getByRole("textbox", { name: "Retained draft" }));
      expect(draft).toHaveProperty("value", "می‌رود ABC-42");
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
    await user.click(screen.getByRole("button", { name: "بستن" }));
    await waitFor(() => expect(screen.queryByText("Payload ABC-42")).toBeNull());
  } finally {
    act(() => {
      if (id) dismissToast(id);
    });
    view.unmount();
    await setLanguage("en");
  }
});
