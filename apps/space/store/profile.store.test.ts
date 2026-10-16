/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";
import { setLanguage } from "@plane/i18n";
import type { RootStore } from "./root.store";
import { ProfileStore } from "./profile.store";

vi.mock("@plane/i18n", () => ({ setLanguage: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@plane/services", () => ({
  UserService: vi.fn(function () {
    return {};
  }),
}));

it("restores the authenticated profile through the shared language setter", async () => {
  const store = new ProfileStore({} as RootStore);
  store.userService.profile = vi.fn().mockResolvedValue({ ...store.data, language: "fa" });
  await store.fetchUserProfile();
  expect(setLanguage).toHaveBeenCalledWith("fa");
  expect(store.data.language).toBe("fa");
});
