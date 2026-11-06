/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { i18nInstance, initPromise, setLanguage } from "@plane/i18n";
import { uploadFirstFileAndInsertRemaining } from "@/hooks/use-file-upload";
import { CustomImageUploader } from "./uploader";

const upload = vi.hoisted(() => ({ uploading: false, dragging: false }));
vi.mock("@/hooks/use-file-upload", () => ({
  useUploader: () => ({ isUploading: upload.uploading, uploadFile: vi.fn() }),
  useDropZone: () => ({ draggedInside: upload.dragging }),
  uploadFirstFileAndInsertRemaining: vi.fn(),
}));

it("updates mounted image upload/error/drag/retry copy and input name across languages", async () => {
  await initPromise;
  await setLanguage("fa");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const updateAttributes = vi.fn();
  const props = {
    editor: { isEditable: true, storage: { utility: {}, imageComponent: { fileMap: new Map() } } },
    node: { attrs: { id: "owned-image" } },
    extension: { options: {} },
    getPos: () => 1,
    failedToLoadImage: false,
    hasDuplicationFailed: false,
    selected: false,
    maxFileSize: 5 * 1024 * 1024,
    updateAttributes,
    setIsUploaded: vi.fn(),
    loadImageFromFileSystem: vi.fn(),
  } as unknown as Parameters<typeof CustomImageUploader>[0];
  const render = async () => act(async () => root.render(<CustomImageUploader {...props} />));
  try {
    await render();
    expect(host.textContent).toBe("بارگذاری تصویر");
    expect(host.querySelector("input")?.getAttribute("aria-label")).toBe("بارگذاری تصویر");
    await act(async () => host.querySelector("input")!.dispatchEvent(new Event("change", { bubbles: true })));
    expect(uploadFirstFileAndInsertRemaining).not.toHaveBeenCalled();
    await act(async () => setLanguage("en"));
    expect(host.textContent).toBe("Upload image");
    await act(async () => setLanguage("fa"));
    upload.dragging = true;
    await render();
    expect(host.textContent).toBe(i18nInstance.t("image_upload.drop"));
    upload.uploading = true;
    await render();
    expect(host.textContent).toBe("در حال بارگذاری…");
    props.hasDuplicationFailed = true;
    await render();
    expect(host.textContent).toContain("خطا در بارگذاری تصویر");
    const retry = host.querySelector<HTMLButtonElement>("button")!;
    expect(retry.title).toBe("تلاش دوباره برای تهیهٔ رونوشت");
    expect(retry.textContent).toBe(i18nInstance.t("common.retry"));
    await act(async () => retry.click());
    expect(updateAttributes).toHaveBeenCalledExactlyOnceWith({ status: "duplicating" });
    props.hasDuplicationFailed = false;
    props.failedToLoadImage = true;
    await render();
    expect(host.querySelector("button")).toBeNull();
    expect(host.textContent).toBe("خطا در بارگذاری تصویر");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    upload.uploading = false;
    upload.dragging = false;
    await setLanguage("en");
    vi.unstubAllGlobals();
  }
});
