/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { autorun } from "mobx";
import { afterEach, expect, it, vi } from "vitest";
import type { IWorkspace } from "@plane/types";
import type { CoreRootStore } from "../root.store";
import { BaseWorkspaceRootStore } from "./index";

vi.mock("@/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function () {
    return {};
  }),
}));
vi.mock("./api-token.store", () => ({
  ApiTokenStore: vi.fn(function () {
    return {};
  }),
}));
vi.mock("./home", () => ({
  HomeStore: vi.fn(function () {
    return {};
  }),
}));
vi.mock("./webhook.store", () => ({
  WebhookStore: vi.fn(function () {
    return {};
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

it.each(["success", "rejection"] as const)("resets the observed workspace loader after %s", async (outcome) => {
  const warnings = vi.spyOn(console, "warn");
  const store = new BaseWorkspaceRootStore({} as CoreRootStore);
  const loaderStates: boolean[] = [];
  const dispose = autorun(() => {
    loaderStates.push(store.loader);
  });
  let resolve!: (workspaces: IWorkspace[]) => void;
  let reject!: (error: unknown) => void;
  store.workspaceService.userWorkspaces = vi.fn(
    () =>
      new Promise<IWorkspace[]>((resolveRequest, rejectRequest) => {
        resolve = resolveRequest;
        reject = rejectRequest;
      })
  );

  try {
    const fetched = store.fetchWorkspaces();
    expect(loaderStates).toEqual([false, true]);

    if (outcome === "success") {
      const workspace = { id: "workspace-one", slug: "workspace-one" } as IWorkspace;
      const response = [workspace];
      resolve(response);
      await expect(fetched).resolves.toBe(response);
      expect(store.workspaces).toEqual({ "workspace-one": workspace });
    } else {
      const error = new Error("Workspace fetch failed");
      reject(error);
      await expect(fetched).rejects.toBe(error);
      expect(store.workspaces).toEqual({});
    }

    expect(store.workspaceService.userWorkspaces).toHaveBeenCalledOnce();
    expect(loaderStates).toEqual([false, true, false]);
    expect(
      warnings.mock.calls.some(
        ([message]) => typeof message === "string" && /\[MobX\].*BaseWorkspaceRootStore@\d+\.loader/.test(message)
      )
    ).toBe(false);
  } finally {
    dispose();
  }
});
