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
import type { DropzoneOptions } from "react-dropzone";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TIssueAttachment } from "@plane/types";
import { getFileURL, renderFormattedDate } from "@plane/utils";
import { IssueAttachmentsCollapsibleTitle } from "../issue-detail-widgets/attachments/title";
import { IssueAttachmentsDetail } from "./attachment-detail";
import { IssueAttachmentsListItem } from "./attachment-list-item";
import { IssueAttachmentDeleteModal } from "./delete-attachment-modal";
import { IssueAttachmentsUploadItem } from "./attachment-list-upload-item";
import { IssueAttachmentsUploadDetails } from "./attachment-upload-details";
import { IssueAttachmentItemList } from "./attachment-item-list";
import { IssueAttachmentUpload } from "./attachment-upload";
import { IssueAttachmentActionButton } from "../issue-detail-widgets/attachments/quick-action-button";
import { useAttachmentOperations } from "../issue-detail-widgets/attachments/helper";
import type { TAttachmentHelpers } from "../issue-detail-widgets/attachments/helper";
import { EIssueServiceType } from "@plane/types";

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
  createAttachment: vi.fn(),
  removeAttachment: vi.fn(),
  promiseToast: vi.fn(),
  toast: vi.fn(),
  dropzones: [] as DropzoneOptions[],
}));
vi.mock("@plane/blocks/toast", () => ({ setPromiseToast: mocks.promiseToast, setToast: mocks.toast }));
vi.mock("@/hooks/use-file-size", () => ({ useFileSize: () => ({ maxFileSize: 5 * 1024 * 1024 }) }));
vi.mock("react-dropzone", () => ({
  useDropzone: (options: DropzoneOptions) => {
    mocks.dropzones.push(options);
    return {
      getRootProps: (props = {}) => props,
      getInputProps: (props = {}) => ({ ...props, type: "file" }),
      fileRejections: [],
    };
  },
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({
  useIssueDetail: () => ({
    issue: { getIssueById: () => ({ attachment_count: 12 }) },
    attachment: {
      getAttachmentById: () => mocks.asset,
      getAttachmentsByIssueId: () => [],
      getAttachmentsUploadStatusByIssueId: () => [],
      createAttachment: mocks.createAttachment,
      removeAttachment: mocks.removeAttachment,
    },
    fetchActivities: vi.fn(),
    setLastWidgetAction: vi.fn(),
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

it.each([IssueAttachmentsUploadItem, IssueAttachmentsUploadDetails])(
  "localizes progress and its accessible name while isolating the original filename (%s)",
  async (Component) => {
    await initPromise;
    const uploadStatus = { id: "temporary", name: "فایل ABC-42.txt", progress: 42, size: 123, type: "text/plain" };
    const checkLanguage = async (language: "fa" | "en") => {
      await setLanguage(language);
      const html = renderToStaticMarkup(
        createElement(TranslationProvider, null, createElement(Component, { uploadStatus }))
      );
      expect(html).toContain(language === "fa" ? "۴۲٪ انجام شده" : "42% done");
      expect(html).toContain(language === "fa" ? 'aria-label="پیشرفت بارگذاری"' : 'aria-label="Upload progress"');
      expect(html).toContain("<bdi>");
      expect(uploadStatus.progress).toBe(42);
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
    await setLanguage("en");
  }
);

it("refreshes operation and drop callbacks on mounted fa→en→fa, preserves service arguments and reports failures", async () => {
  await initPromise;
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let helpers: TAttachmentHelpers;
  const props = {
    workspaceSlug: "fixture",
    projectId: "project",
    issueId: "issue",
    issueServiceType: EIssueServiceType.ISSUES,
  };
  function Probe() {
    helpers = useAttachmentOperations(props.workspaceSlug, props.projectId, props.issueId, props.issueServiceType);
    return createElement(
      "div",
      null,
      createElement(IssueAttachmentActionButton, props),
      createElement(IssueAttachmentItemList, { ...props, attachmentHelpers: helpers }),
      createElement(IssueAttachmentUpload, { ...props, attachmentOperations: helpers.operations })
    );
  }
  const file = new File(["می‌رود ABC-42"], "فایل ABC-42.txt", { type: "text/plain" });
  try {
    await act(async () => root.render(createElement(TranslationProvider, null, createElement(Probe))));
    const checkLanguage = async (language: "fa" | "en") => {
      mocks.dropzones.length = 0;
      await act(async () => setLanguage(language));
      // A fresh render also covers the initial no-op language selection.
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Probe))));
      const inputs = container.querySelectorAll("input[type=file]");
      expect(inputs).toHaveLength(3);
      for (const input of inputs)
        expect(input.getAttribute("aria-label")).toBe(language === "fa" ? "پیوست کردن" : "Attach");
      mocks.createAttachment.mockResolvedValueOnce({ id: "disposable" });
      await act(async () => helpers!.operations.create(file));
      expect(mocks.createAttachment).toHaveBeenLastCalledWith("fixture", "project", "issue", file);
      const options = mocks.promiseToast.mock.lastCall![1];
      expect(options.loading).toBe(language === "fa" ? "در حال بارگذاری پیوست…" : "Uploading attachment...");
      expect(options.success.title).toBe(language === "fa" ? "پیوست بارگذاری شد" : "Attachment uploaded");
      expect(options.success.message()).toBe(
        language === "fa" ? "پیوست با موفقیت بارگذاری شد" : "The attachment has been successfully uploaded"
      );
      expect(options.error.title).toBe(language === "fa" ? "پیوست بارگذاری نشد" : "Attachment not uploaded");
      expect(options.error.message()).toBe(
        language === "fa"
          ? "پیوست کردن فایل انجام نشد. دوباره بارگذاری کنید."
          : "File could not be attached. Try uploading again."
      );
      const toastDropzones = mocks.dropzones.filter(({ onDrop }) => onDrop?.length === 2).slice(-2);
      expect(toastDropzones).toHaveLength(2);
      await act(async () => {
        for (const dropzone of toastDropzones) {
          dropzone.onDrop!(
            [],
            [{ file, errors: [{ code: "file-too-large", message: "File is too large" }] }],
            new Event("change")
          );
          expect(mocks.toast.mock.lastCall![0].message).toBe(
            language === "fa" ? "حجم فایل باید ۵ مگابایت یا کمتر باشد." : "File must be of 5MB or less in size."
          );
          dropzone.onDrop!(
            [],
            [file, file].map((rejectedFile) => ({
              file: rejectedFile,
              errors: [{ code: "too-many-files", message: "Too many files" }],
            })),
            new Event("change")
          );
          expect(mocks.toast.mock.lastCall![0].message).toBe(
            language === "fa" ? "هر بار فقط یک فایل می‌توان بارگذاری کرد." : "Only one file can be uploaded at a time."
          );
        }
      });
      mocks.removeAttachment.mockResolvedValueOnce(undefined);
      await act(async () => helpers!.operations.remove("disposable"));
      expect(mocks.removeAttachment).toHaveBeenLastCalledWith("fixture", "project", "issue", "disposable");
      expect(mocks.toast.mock.lastCall![0].title).toBe(language === "fa" ? "پیوست حذف شد" : "Attachment removed");
      mocks.removeAttachment.mockRejectedValueOnce(new Error("offline"));
      await act(async () => helpers!.operations.remove("disposable"));
      expect(mocks.toast.mock.lastCall![0].message).toBe(
        language === "fa" ? "حذف پیوست انجام نشد" : "The attachment could not be removed"
      );
      const failure = new Error("offline");
      mocks.createAttachment.mockRejectedValueOnce(failure);
      await act(async () => {
        await expect(helpers!.operations.create(file)).rejects.toBe(failure);
      });
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
