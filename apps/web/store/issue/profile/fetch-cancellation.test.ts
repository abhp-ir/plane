/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";
import type { TIssuesResponse } from "@plane/types";
import type { IIssueRootStore } from "../root.store";
import type { IProfileIssuesFilter } from "./filter.store";
import { ProfileIssues } from "./issue.store";

vi.mock("@/lib/store-context", () => ({ store: {} }));

const response = {
  results: [],
  total_count: 0,
  prev_cursor: "",
  next_cursor: "",
  next_page_results: false,
} as unknown as TIssuesResponse;
const options = { perPageCount: 4, canGroup: true };

const setup = () => {
  const addIssue = vi.fn(),
    extractRelations = vi.fn();
  const root = {
    rootStore: { router: {} },
    issues: { addIssue, getIssuesByIds: () => [] },
    issueDetail: { relation: { extractRelationsFromIssues: extractRelations } },
  } as unknown as IIssueRootStore;
  const filters = { getFilterParams: () => ({ expand: "" }) } as unknown as IProfileIssuesFilter;
  const store = new ProfileIssues(root, filters);
  const pending: {
    signal: AbortSignal;
    resolve: (value: TIssuesResponse) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const request = vi.spyOn(store.userService, "getUserProfileIssues").mockImplementation(
    (_workspace, _user, _params, config) =>
      new Promise<TIssuesResponse>((resolve, reject) => {
        pending.push({ signal: (config as { signal: AbortSignal }).signal, resolve, reject });
      })
  );
  return { store, pending, request, addIssue, extractRelations };
};

it("resolves an obsolete profile request without resetting the next view's loader or parameters", async () => {
  const { store, pending, request, addIssue } = setup();
  const obsolete = Promise.allSettled([store.fetchIssues("workspace", "user", "init-loader", options, "assigned")]);
  const latest = store.fetchIssues("workspace", "user", "init-loader", options, "created");
  expect(pending[0].signal.aborted).toBe(true);
  pending[0].reject(undefined);
  const outcome = await obsolete;
  const loader = store.getIssueLoader();
  pending[1].resolve(response);
  await latest;
  expect(outcome).toEqual([{ status: "fulfilled", value: undefined }]);
  expect(loader).toBe("init-loader");
  expect(request.mock.calls[0][2]).toMatchObject({ assignees: "user" });
  expect(request.mock.calls[1][2]).toMatchObject({ created_by: "user", assignees: undefined });
  expect(addIssue).toHaveBeenCalledTimes(1);
});

it("ignores an obsolete profile response that finishes successfully", async () => {
  const { store, pending, addIssue } = setup();
  const obsolete = store.fetchIssues("workspace", "user", "init-loader", options, "assigned");
  const latest = store.fetchIssues("workspace", "user", "init-loader", options, "subscribed");
  pending[0].resolve(response);
  const result = await obsolete;
  const processed = addIssue.mock.calls.length;
  const latestAborted = pending[1].signal.aborted;
  pending[1].resolve(response);
  await latest;
  expect(result).toBeUndefined();
  expect(processed).toBe(0);
  expect(latestAborted).toBe(false);
  expect(addIssue).toHaveBeenCalledTimes(1);
});

it("retains real profile request failures and clears the current loader", async () => {
  const { store, request } = setup();
  const failure = { detail: "Permission denied" };
  request.mockRejectedValueOnce(failure).mockRejectedValueOnce(undefined);
  await expect(store.fetchIssues("workspace", "user", "init-loader", options, "assigned")).rejects.toBe(failure);
  expect(store.getIssueLoader()).toBeUndefined();
  expect(await Promise.allSettled([store.fetchIssues("workspace", "user", "init-loader", options, "created")])).toEqual(
    [{ status: "rejected", reason: undefined }]
  );
});

it("retains response processing errors even when processing clears the controller", async () => {
  const { store, request, extractRelations } = setup();
  const failure = new Error("Response processing failed");
  request.mockResolvedValue(response);
  extractRelations.mockImplementation(() => {
    throw failure;
  });
  await expect(store.fetchIssues("workspace", "user", "init-loader", options, "assigned")).rejects.toBe(failure);
  expect(store.getIssueLoader()).toBeUndefined();
});
