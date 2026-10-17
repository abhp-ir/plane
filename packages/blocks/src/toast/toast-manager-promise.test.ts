/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it } from "vitest";
import { setPromiseToast } from "./toast-manager";

it("handles rejected toast notifications while preserving rejection for the original caller", async () => {
  const error = new Error("Save rejected");
  const original = Promise.reject(error);
  expect(setPromiseToast(original, { success: { title: "Saved" }, error: { title: "Failed" } })).toBeUndefined();
  // Let unhandled rejections surface before the original caller awaits its result.
  await new Promise<void>((resolve) => setTimeout(resolve, 25));
  await expect(original).rejects.toBe(error);
});
