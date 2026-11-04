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
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { getPasswordCriteria, getPasswordStrength } from "@plane/utils";
import { PasswordStrengthIndicator, getStrengthInfo } from "@plane/blocks/auth";

vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});

it("localizes criteria, numeric minimums and strength reactively without changing password evaluation", async () => {
  await initPromise;
  await setLanguage("fa");
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const render = (password: string) =>
    root.render(
      createElement(TranslationProvider, null, createElement(PasswordStrengthIndicator, { password, isFocused: true }))
    );
  const original = getPasswordCriteria("Abcd12!?");
  try {
    await act(async () => render("a"));
    expect(container.textContent).toContain("حداقل ۸ نویسه");
    expect(container.textContent).toContain("حداقل ۱ حرف بزرگ انگلیسی");
    expect(container.textContent).toContain("حداقل ۱ حرف کوچک انگلیسی");
    expect(container.textContent).toContain("حداقل ۱ رقم انگلیسی");
    expect(container.textContent).toContain("حداقل ۱ نویسهٔ ویژه");
    expect(container.textContent).toContain("گذرواژه بیش از حد کوتاه است");
    expect(container.textContent).not.toMatch(/[A-Za-z0-9{}]/);
    await act(async () => render("abcdefgh"));
    expect(container.textContent).toContain("گذرواژه ضعیف است");
    await act(async () => render("Abcd12!?"));
    expect(container.textContent).toContain("گذرواژه قوی است");
    await act(async () => setLanguage("en"));
    expect(container.textContent).toContain("Min 8 characters");
    expect(container.textContent).toContain("Min 1 upper-case letter");
    expect(container.textContent).toContain("Password is strong");
    await act(async () => setLanguage("fa"));
    expect(container.textContent).toContain("حداقل ۸ نویسه");
    expect(getPasswordCriteria("Abcd12!?")).toEqual(original);
    expect(original.every(({ isValid }) => isValid)).toBe(true);
    expect(getPasswordStrength("Abcd12!?")).toBe(E_PASSWORD_STRENGTH.STRENGTH_VALID);
    expect(getPasswordStrength("Abcd1!?")).toBe(E_PASSWORD_STRENGTH.LENGTH_NOT_VALID);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    await setLanguage("en");
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});

it("preserves the exported default English strength contract", () => {
  expect(getStrengthInfo(E_PASSWORD_STRENGTH.EMPTY).message).toBe("Please enter your password");
  expect(getStrengthInfo(E_PASSWORD_STRENGTH.LENGTH_NOT_VALID).message).toBe("Password is too short");
  expect(getStrengthInfo(E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID).message).toBe("Password is weak");
  expect(getStrengthInfo(E_PASSWORD_STRENGTH.STRENGTH_VALID).message).toBe("Password is strong");
});
