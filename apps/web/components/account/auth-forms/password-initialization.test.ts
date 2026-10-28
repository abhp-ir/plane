// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { observable, runInAction } from "mobx";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { ResetPasswordForm } from "./reset-password";
import { SetPasswordForm } from "./set-password";

const requestCsrf = vi.hoisted(() => vi.fn());
const account = observable({ email: undefined as string | undefined });
const handleSetPassword = vi.fn();
vi.mock("@/services/auth.service", () => ({
  AuthService: class {
    requestCSRFToken() {
      return requestCsrf();
    }
  },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("uidb64=unit-user&token=unit-token"),
}));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: account, handleSetPassword }) }));
vi.mock("@/hooks/use-app-router", () => ({ useAppRouter: () => ({ push: vi.fn() }) }));
vi.mock("@plane/blocks/auth", () => ({ PasswordStrengthIndicator: () => null }));

it.each([
  ["reset", ResetPasswordForm],
  ["set", SetPasswordForm],
] as const)(
  "keeps %s inputs controlled across deferred CSRF/account hydration and preserves password matching",
  async (mode, Component) => {
    await initPromise;
    await setLanguage("fa");
    runInAction(() => {
      account.email = undefined;
    });
    let resolveCsrf!: (value: { csrf_token: string }) => void;
    requestCsrf.mockReset().mockReturnValue(
      new Promise<{ csrf_token: string }>((resolve) => {
        resolveCsrf = resolve;
      })
    );
    handleSetPassword.mockClear();
    const errors = vi.spyOn(console, "error");
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const input = (name: string) => container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    const change = async (name: string, value: string) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(name), value);
        input(name).dispatchEvent(new Event("input", { bubbles: true }));
      });
    try {
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Component))));
      expect(requestCsrf).toHaveBeenCalledTimes(1);
      expect(input("password").value).toBe("");
      expect(input("confirm_password").value).toBe("");
      const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      expect(submit.disabled).toBe(true);
      if (mode === "reset") {
        expect(input("csrfmiddlewaretoken").value).toBe("");
        expect(container.querySelector("form")?.getAttribute("action")).toMatch(
          /\/auth\/reset-password\/unit-user\/unit-token\/$/
        );
        expect(container.querySelector("form")?.getAttribute("method")).toBe("POST");
      }
      await act(async () => {
        runInAction(() => {
          account.email = "disposable@example.test";
        });
        resolveCsrf({ csrf_token: "unit-csrf-token" });
      });
      if (mode === "reset") expect(input("csrfmiddlewaretoken").value).toBe("unit-csrf-token");
      else expect(input("email").value).toBe("disposable@example.test");
      const password = "آزمون‌امنA1!a";
      await change("password", password);
      await change("confirm_password", password + "x");
      expect(submit.disabled).toBe(true);
      await change("confirm_password", password);
      expect(submit.disabled).toBe(false);
      const toggles = container.querySelectorAll<HTMLButtonElement>("button[aria-label]");
      expect(toggles).toHaveLength(2);
      expect(toggles[0].getAttribute("aria-label")).toMatch(/[آ-ی]/);
      await act(async () => toggles[0].click());
      expect(input("password").type).toBe("text");
      expect(input("password").value).toBe(password);
      await act(async () => setLanguage("en"));
      expect(toggles[0].getAttribute("aria-label")).toMatch(/hide password/i);
      expect(input("password").value).toBe(password);
      await act(async () => setLanguage("fa"));
      expect(toggles[0].getAttribute("aria-label")).toMatch(/[آ-ی]/);
      await act(async () => toggles[0].click());
      expect(input("password").type).toBe("password");
      expect(handleSetPassword).not.toHaveBeenCalled();
      expect(requestCsrf).toHaveBeenCalledTimes(1);
      expect(errors.mock.calls.filter((call) => /uncontrolled|controlled input/.test(String(call[0])))).toEqual([]);
    } finally {
      await act(async () => root.unmount());
      errors.mockRestore();
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
