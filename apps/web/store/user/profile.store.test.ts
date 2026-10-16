/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, expect, it, vi } from "vitest";
import { setLanguage } from "@plane/i18n";
import type { TUserProfile } from "@plane/types";
import type { CoreRootStore } from "../root.store";
import { ProfileStore } from "./profile.store";

vi.mock("@plane/i18n", () => ({ setLanguage: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/services/user.service", () => ({
  UserService: vi.fn(function () {
    return {};
  }),
}));

let store: ProfileStore;
beforeEach(() => {
  vi.clearAllMocks();
  store = new ProfileStore({} as CoreRootStore);
  store.data.language = "en";
});

it("restores the server preference before profile initialization completes", async () => {
  store.userService.getCurrentUserProfile = vi.fn().mockResolvedValue({ ...store.data, language: "fa" });
  let finishLanguage!: () => void;
  vi.mocked(setLanguage).mockReturnValueOnce(new Promise<void>((resolve) => (finishLanguage = resolve)));
  const fetched = store.fetchUserProfile();
  await vi.waitFor(() => expect(setLanguage).toHaveBeenCalledWith("fa"));
  let completed = false;
  void fetched.then(() => (completed = true));
  await Promise.resolve();
  expect(completed).toBe(false);
  finishLanguage();
  await fetched;
  expect(store.data.language).toBe("fa");
});

it("changes document language only after a successful save", async () => {
  let save!: (profile: TUserProfile) => void;
  store.userService.updateCurrentUserProfile = vi.fn().mockReturnValue(new Promise((resolve) => (save = resolve)));
  const update = store.updateUserProfile({ language: "fa" });
  expect(setLanguage).not.toHaveBeenCalled();
  save({ ...store.data, language: "fa" });
  await update;
  expect(setLanguage).toHaveBeenCalledWith("fa");
  expect(store.data.language).toBe("fa");
});

it("rejects a failed save and restores the previous preference without changing direction", async () => {
  const error = new Error("Disconnected");
  store.userService.updateCurrentUserProfile = vi.fn().mockRejectedValue(error);
  await expect(store.updateUserProfile({ language: "fa" })).rejects.toBe(error);
  expect(store.data.language).toBe("en");
  expect(setLanguage).not.toHaveBeenCalled();
  expect(store.error?.status).toBe("user-profile-update-error");
});

it("does not reset language when saving an unrelated profile field", async () => {
  store.data.language = "fa";
  store.userService.updateCurrentUserProfile = vi.fn().mockResolvedValue({ ...store.data, role: "Engineer" });
  await store.updateUserProfile({ role: "Engineer" });
  expect(store.data.language).toBe("fa");
  expect(setLanguage).not.toHaveBeenCalled();
});

it("does not roll back another preference when a language save fails", async () => {
  let rejectSave!: (error: Error) => void;
  store.userService.updateCurrentUserProfile = vi
    .fn()
    .mockReturnValue(new Promise((_, reject) => (rejectSave = reject)));
  const update = store.updateUserProfile({ language: "fa" });
  store.mutateUserProfile({ start_of_the_week: 1 });
  rejectSave(new Error("Disconnected"));
  await expect(update).rejects.toThrow("Disconnected");
  expect(store.data.language).toBe("en");
  expect(store.data.start_of_the_week).toBe(1);
});
