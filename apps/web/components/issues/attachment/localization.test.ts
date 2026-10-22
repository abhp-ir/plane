// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TIssueAttachment } from "@plane/types";
import { getFileURL, renderFormattedDate } from "@plane/utils";
import { IssueAttachmentsCollapsibleTitle } from "../issue-detail-widgets/attachments/title";
import { IssueAttachmentsDetail } from "./attachment-detail";
import { IssueAttachmentsListItem } from "./attachment-list-item";
import { IssueAttachmentDeleteModal } from "./delete-attachment-modal";

vi.mock("@plane/i18n", async () => {
  const { createRequire } = await import("node:module");
  // Use the established CJS ICU test boundary; the real browser verifies Vite's output separately.
  const webRequire = createRequire(`${process.cwd()}/package.json`);
  const require = createRequire(webRequire.resolve("@plane/i18n"));
  const { createInstance } = require("i18next");
  const ICU = require("i18next-icu").default;
  const reactI18next = require("react-i18next");
  const instance = createInstance();
  const ready = instance
    .use(ICU)
    .use(reactI18next.initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      resources: {
        fa: { translation: (await import("../../../../../packages/i18n/src/locales/fa/common.json")).default },
        en: { translation: (await import("../../../../../packages/i18n/src/locales/en/common.json")).default },
      },
      interpolation: { escapeValue: false },
    });
  return {
    initPromise: ready,
    i18nInstance: instance,
    Trans: reactI18next.Trans,
    setLanguage: (language: string) => instance.changeLanguage(language),
    TranslationProvider: ({ children }: { children: ReactNode }) =>
      createElement(reactI18next.I18nextProvider, { i18n: instance }, children),
    useTranslation: () => {
      const { t, i18n } = reactI18next.useTranslation();
      return { t, currentLocale: i18n.language };
    },
  };
});

const mocks = vi.hoisted(() => ({
  asset: undefined as TIssueAttachment | undefined,
  tooltip: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    issue: { getIssueById: () => ({ attachment_count: 12 }) },
    attachment: { getAttachmentById: () => mocks.asset },
  }),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({
    getUserDetails: (id: string) => ({ display_name: id === "creator" ? "سارا ABC-42" : "Editor must stay separate" }),
  }),
}));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) => {
    mocks.tooltip(label);
    return children;
  },
}));

const asset: TIssueAttachment = {
  id: "retained-asset",
  issue_id: "retained-issue",
  attributes: { name: "File <script> می‌رود ABC-42.png", size: 68 },
  asset_url: "/signed/file.png?signature=ABC-42",
  created_by: "creator",
  updated_by: "editor",
  created_at: "2025-03-20T12:00:00Z",
  updated_at: "2026-04-20T12:00:00Z",
};

it.each(["list", "detail"] as const)(
  "localizes file size and upload metadata without changing signed URLs, filenames or stored values (%s)",
  async (surface) => {
    await initPromise;
    mocks.asset = structuredClone(asset);
    try {
      const checkLanguage = async (language: "fa" | "en") => {
        await setLanguage(language);
        mocks.tooltip.mockClear();
        const component =
          surface === "list"
            ? createElement(IssueAttachmentsListItem, { attachmentId: asset.id })
            : createElement(IssueAttachmentsDetail, {
                attachmentId: asset.id,
                attachmentHelpers: {
                  operations: { create: async () => {}, remove: mocks.remove },
                  snapshot: { uploadStatus: undefined },
                },
              });
        const html = renderToStaticMarkup(
          createElement(MemoryRouter, null, createElement(TranslationProvider, null, component))
        );
        expect(html).toContain(language === "fa" ? "۶۸ بایت" : "68 bytes");
        expect(html).toContain(`href="${getFileURL(asset.asset_url)}"`);
        expect(html).toContain('rel="noopener noreferrer"');
        expect(html).toContain('alt="PNG"');
        if (surface === "list") expect(html).toContain('aria-label="سارا ABC-42"');
        expect(html).toContain("<bdi>");
        expect(html).not.toContain("<script>");
        const date = renderFormattedDate(asset.created_at, undefined, language);
        expect(mocks.tooltip.mock.calls.map(([label]) => label)).toContain(
          language === "fa"
            ? `\u2068سارا ABC-42\u2069 این فایل را در \u2068${date}\u2069 بارگذاری کرد.`
            : `\u2068سارا ABC-42\u2069 uploaded this file on \u2068${date}\u2069.`
        );
        expect(mocks.tooltip.mock.calls.map(([label]) => label)).toContain(asset.attributes.name);
        expect(mocks.asset).toEqual(asset);
      };
      await checkLanguage("fa");
      await checkLanguage("en");
      await checkLanguage("fa");
    } finally {
      await setLanguage("en");
    }
  }
);

it("updates the mounted count and rich confirmation on fa→en→fa, preserves the complete filename and cancels without removing", async () => {
  await initPromise;
  mocks.asset = structuredClone(asset);
  mocks.close.mockClear();
  mocks.remove.mockClear();
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
          createElement(IssueAttachmentsCollapsibleTitle, { issueId: asset.issue_id }),
          createElement(IssueAttachmentDeleteModal, {
            isOpen: true,
            onClose: mocks.close,
            attachmentId: asset.id,
            attachmentOperations: { remove: mocks.remove },
          })
        )
      )
    );
    const checkLanguage = async (language: "fa" | "en") => {
      await act(async () => setLanguage(language));
      expect(container.textContent).toBe(language === "fa" ? "پیوست‌ها۱۲" : "Attachments12");
      const dialog = document.querySelector<HTMLElement>('[role="alertdialog"]')!;
      expect(dialog).not.toBeNull();
      expect(dialog.querySelector("bdi")?.textContent).toBe(asset.attributes.name);
      expect(dialog.querySelector("script")).toBeNull();
      expect(dialog.querySelector("p")?.textContent).toBe(
        language === "fa"
          ? `آیا می‌خواهید پیوست ${asset.attributes.name} را حذف کنید؟ این پیوست برای همیشه حذف می‌شود. این کار بازگشت‌پذیر نیست.`
          : `Are you sure you want to delete ${asset.attributes.name}? This attachment will be permanently removed. This action cannot be undone.`
      );
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
    const cancel = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')).find(
      (button) => button.textContent === "انصراف"
    )!;
    await act(async () => cancel.click());
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.asset).toEqual(asset);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
