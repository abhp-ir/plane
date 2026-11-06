/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { afterEach, expect, it, vi } from "vitest";
import { initPromise, setLanguage } from "@plane/i18n";
import { EFileError, isFileValid } from "./file";

afterEach(async () => setLanguage("en"));

it.each([
  [
    "fa",
    "فایلی انتخاب نشده است. فایلی را برای بارگذاری انتخاب کنید.",
    "نوع فایل نامعتبر است",
    "حجم فایل باید ۵ مگابایت یا کمتر باشد.",
  ],
  [
    "en",
    "No file selected. Please select a file to upload.",
    "Invalid file type",
    "File must be of 5MB or less in size.",
  ],
] as const)(
  "localizes file rejection without changing error codes or accepted files (%s)",
  async (language, missing, type, size) => {
    await initPromise;
    await setLanguage(language);
    const onError = vi.fn();
    const args = { acceptedMimeTypes: ["image/png"], maxFileSize: 5 * 1024 * 1024, onError };
    expect(isFileValid({ ...args, file: undefined as unknown as File })).toBe(false);
    expect(onError).toHaveBeenLastCalledWith(EFileError.NO_FILE_SELECTED, missing);
    expect(isFileValid({ ...args, file: new File(["text"], "نام.txt", { type: "text/plain" }) })).toBe(false);
    expect(onError).toHaveBeenLastCalledWith(EFileError.INVALID_FILE_TYPE, type);
    expect(
      isFileValid({ ...args, file: new File([new Uint8Array(args.maxFileSize + 1)], "نام.png", { type: "image/png" }) })
    ).toBe(false);
    expect(onError).toHaveBeenLastCalledWith(EFileError.FILE_SIZE_TOO_LARGE, size);
    onError.mockClear();
    const file = new File([new Uint8Array(args.maxFileSize)], "علی‌رضا.png", { type: "image/png" });
    expect(isFileValid({ ...args, file })).toBe(true);
    expect(file.name).toBe("علی‌رضا.png");
    expect(onError).not.toHaveBeenCalled();
  }
);
