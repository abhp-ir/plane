/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTranslationKeys } from "@plane/i18n";

const form = "account_settings.profile.change_email_modal.form";
const errorKeys = new Map<string, TTranslationKeys>([
  ["5005", `${form}.email.errors.invalid`],
  ["5010", `${form}.email.errors.required`],
  ["Email is required", `${form}.email.errors.required`],
  ["Invalid email format", `${form}.email.errors.invalid`],
  ["New email must be different from current email", `${form}.email.errors.exists`],
  ["An account with this email already exists", `${form}.email.errors.exists`],
  ["Verification code is required", `${form}.code.errors.required`],
  ["Invalid verification code", `${form}.code.errors.invalid`],
  ["Verification code has expired or is invalid", `${form}.code.errors.expired`],
]);

export function getChangeEmailErrorKey(error: unknown): TTranslationKeys {
  const err = error as { error_code?: unknown; error?: unknown } | undefined;
  const code = typeof err?.error_code === "string" || typeof err?.error_code === "number" ? String(err.error_code) : "";
  const message = typeof err?.error === "string" ? err.error : "";
  return errorKeys.get(code) ?? errorKeys.get(message) ?? "common.errors.default.message";
}
