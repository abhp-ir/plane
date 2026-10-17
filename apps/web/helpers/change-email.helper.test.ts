/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getChangeEmailErrorKey } from "./change-email.helper";

const prefix = "account_settings.profile.change_email_modal.form";

describe("change-email error localization", () => {
  it.each([
    [{ error_code: 5005, error_message: "INVALID_EMAIL" }, `${prefix}.email.errors.invalid`],
    [{ error_code: "5010", error_message: "EMAIL_REQUIRED" }, `${prefix}.email.errors.required`],
    [{ error: "Email is required" }, `${prefix}.email.errors.required`],
    [{ error: "Invalid email format" }, `${prefix}.email.errors.invalid`],
    [{ error: "New email must be different from current email" }, `${prefix}.email.errors.exists`],
    [{ error: "An account with this email already exists" }, `${prefix}.email.errors.exists`],
    [{ error: "Verification code is required" }, `${prefix}.code.errors.required`],
    [{ error: "Invalid verification code" }, `${prefix}.code.errors.invalid`],
    [{ error: "Verification code has expired or is invalid" }, `${prefix}.code.errors.expired`],
  ])("keeps the server's actionable meaning for %j", (error, expected) => {
    expect(getChangeEmailErrorKey(error)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    new Error("Network unavailable"),
    { error: "Failed to verify code. Please try again." },
    { error: "Failed to generate verification code. Please try again." },
    { detail: "Request was throttled. Expected available in 300 seconds." },
    { error_code: 5000, error_message: "INSTANCE_NOT_CONFIGURED" },
    { error: { email: ["Unrecognized server detail"] } },
    { error: "__proto__" },
  ])("uses localized generic feedback for unknown or transport failure %j", (error) => {
    expect(getChangeEmailErrorKey(error)).toBe("common.errors.default.message");
  });
});
