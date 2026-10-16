/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDirection } from "@base-ui/react/direction-provider";
import { afterEach, expect, it } from "vitest";
import { TranslationProvider, initPromise, setLanguage, useTranslation } from "@plane/i18n";
import { LocaleDirectionProvider } from "./locale-direction-provider";
import { ConfirmDialog } from "../dialog/confirm-dialog";

function Controls() {
  const direction = useDirection();
  return (
    <>
      <output aria-label="Direction">{direction}</output>
      <ConfirmDialog
        isOpen
        isSubmitting={false}
        title="Plane ABC-42"
        content={<bdi>پروژهٔ Plane ABC-42</bdi>}
        handleClose={() => {}}
        handleSubmit={() => {}}
      />
    </>
  );
}

afterEach(async () => {
  cleanup();
  await setLanguage("en");
});

it("updates the existing primitive context, root, storage, and an open portal when the hook changes language", async () => {
  await initPromise;
  await setLanguage("en");
  const user = userEvent.setup();
  render(
    <TranslationProvider>
      <LocaleDirectionProvider>
        <Controls />
      </LocaleDirectionProvider>
    </TranslationProvider>
  );
  expect(screen.getByLabelText("Direction").textContent).toBe("ltr");
  // The modal traps focus, so drive its locale through the same public setter first.
  await act(() => setLanguage("fa"));
  expect(screen.getByLabelText("Direction").textContent).toBe("rtl");
  expect(document.documentElement.lang).toBe("fa");
  expect(document.documentElement.dir).toBe("rtl");
  expect(localStorage.getItem("userLanguage")).toBe("fa");
  expect(await screen.findByRole("button", { name: "انصراف" })).toBeDefined();
  cleanup();
  render(
    <TranslationProvider>
      <LocaleDirectionProvider>
        <ControlsWithoutDialog />
      </LocaleDirectionProvider>
    </TranslationProvider>
  );
  await user.click(screen.getByRole("button", { name: "English" }));
  await screen.findByText("ltr");
  expect(document.documentElement.dir).toBe("ltr");
  expect(localStorage.getItem("userLanguage")).toBe("en");
  await user.click(screen.getByRole("button", { name: "فارسی" }));
  await screen.findByText("rtl");
});

function ControlsWithoutDialog() {
  const direction = useDirection();
  const { changeLanguage } = useTranslation();
  return (
    <>
      <output>{direction}</output>
      <button onClick={() => changeLanguage("fa")}>فارسی</button>
      <button onClick={() => changeLanguage("en")}>English</button>
    </>
  );
}
