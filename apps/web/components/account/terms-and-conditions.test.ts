// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { act, createElement, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { EAuthModes } from "@plane/constants";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { AuthFooter } from "@/components/auth-screens/footer";
import { TermsAndConditions } from "./terms-and-conditions";

vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});

it.each([EAuthModes.SIGN_IN, EAuthModes.SIGN_UP])(
  "translates the complete %s consent and count while preserving legal link behavior",
  async (authType) => {
    await initPromise;
    await setLanguage("fa");
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          createElement(
            TranslationProvider,
            null,
            createElement(
              MemoryRouter,
              null,
              createElement(Fragment, null, createElement(TermsAndConditions, { authType }), createElement(AuthFooter))
            )
          )
        )
      );
      const consent = container.querySelector("p")!;
      expect(consent.textContent).toContain(authType === EAuthModes.SIGN_IN ? "با ورود،" : "با ایجاد حساب،");
      expect(consent.textContent).not.toMatch(/[A-Za-z0-9<>]/);
      expect(
        [...container.querySelectorAll("a")].map((link) => ({
          text: link.textContent,
          href: link.href,
          target: link.target,
          rel: link.rel,
        }))
      ).toEqual([
        {
          text: "شرایط استفاده",
          href: "https://plane.so/legals/terms-and-conditions/",
          target: "_blank",
          rel: "noopener noreferrer",
        },
        {
          text: "سیاست حفظ حریم خصوصی",
          href: "https://plane.so/legals/privacy-policy/",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ]);
      expect(container.textContent).toContain("۱۰٬۰۰۰");
      expect(container.querySelector("bdi")?.textContent).toBe("Plane");
      await act(async () => setLanguage("en"));
      expect(consent.textContent).toBe(
        `${authType === EAuthModes.SIGN_IN ? "By signing in" : "By creating an account"}, you understand and agree to \n our Terms of Service and Privacy Policy.`
      );
      expect(container.textContent).toContain("Join 10,000+ teams building with Plane");
      await act(async () => setLanguage("fa"));
      expect(consent.textContent).toContain("می‌پذیرید.");
      expect(container.querySelectorAll("a")).toHaveLength(2);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      await setLanguage("en");
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  }
);
