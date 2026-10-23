/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";
import type { TIssuesResponse } from "@plane/types";
import type { IIssueRootStore } from "../root.store";
import type { IModuleIssuesFilter } from "./filter.store";
import { ModuleIssues } from "./issue.store";

vi.mock("@/lib/store-context", () => ({ store: {} }));

const response = {
  results: [],
  total_count: 0,
  prev_cursor: "",
  next_cursor: "",
  next_page_results: false,
} as unknown as TIssuesResponse;
const options = { perPageCount: 4, canGroup: true, before: "2025-03-22", after: "2025-02-16" };

const setup = () => {
  const addIssue = vi.fn();
  const extractRelations = vi.fn();
  const root = {
    rootStore: { router: {}, module: { fetchModuleDetails: vi.fn(), getModuleById: () => undefined } },
    issues: { addIssue, getIssuesByIds: () => [] },
    issueDetail: { relation: { extractRelationsFromIssues: extractRelations } },
  } as unknown as IIssueRootStore;
  const getFilterParams = vi.fn(() => ({ expand: "" }));
  const filters = { getFilterParams } as unknown as IModuleIssuesFilter;
  const store = new ModuleIssues(root, filters);
  const pending: {
    signal: AbortSignal;
    resolve: (value: TIssuesResponse) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const request = vi.spyOn(store.issueService, "getIssues").mockImplementation(
    (_workspace, _project, _query, config) =>
      new Promise<TIssuesResponse>((resolve, reject) => {
        pending.push({ signal: (config as { signal: AbortSignal }).signal, resolve, reject });
      })
  );
  return { store, pending, addIssue, extractRelations, request, getFilterParams };
};

it("resolves an aborted obsolete request without clearing its successor's loader", async () => {
  const { store, pending, addIssue, request, getFilterParams } = setup();
  const obsolete = Promise.allSettled([store.fetchIssues("workspace", "project", "init-loader", options, "module")]);
  const latest = store.fetchIssues("workspace", "project", "init-loader", options, "module");
  expect(pending[0].signal.aborted).toBe(true);
  pending[0].reject(undefined); // The existing service maps a canceled Axios error to response?.data.
  const outcome = await obsolete;
  const loaderWhileLatestPending = store.getIssueLoader();
  pending[1].resolve(response);
  await latest;
  expect(outcome).toEqual([{ status: "fulfilled", value: undefined }]);
  expect(loaderWhileLatestPending).toBe("init-loader");
  expect(addIssue).toHaveBeenCalledTimes(1);
  expect(getFilterParams).toHaveBeenNthCalledWith(1, options, "module", undefined, undefined, undefined);
  expect(request).toHaveBeenNthCalledWith(2, "workspace", "project", { expand: "" }, { signal: pending[1].signal });
});

it("ignores a superseded response even if its transport finishes successfully", async () => {
  const { store, pending, addIssue } = setup();
  const obsolete = store.fetchIssues("workspace", "project", "init-loader", options, "module");
  const latest = store.fetchIssues("workspace", "project", "init-loader", options, "module");
  pending[0].resolve(response);
  const obsoleteResult = await obsolete;
  const processedBeforeLatest = addIssue.mock.calls.length;
  const latestWasAborted = pending[1].signal.aborted;
  pending[1].resolve(response);
  await latest;
  expect(obsoleteResult).toBeUndefined();
  expect(processedBeforeLatest).toBe(0);
  expect(latestWasAborted).toBe(false);
  expect(addIssue).toHaveBeenCalledTimes(1);
});

it("preserves real request failures, including undefined failures without cancellation", async () => {
  const { store, request } = setup();
  const failure = { detail: "Permission denied" };
  request.mockRejectedValueOnce(failure).mockRejectedValueOnce(undefined);
  await expect(store.fetchIssues("workspace", "project", "init-loader", options, "module")).rejects.toBe(failure);
  expect(store.getIssueLoader()).toBeUndefined();
  expect(
    await Promise.allSettled([store.fetchIssues("workspace", "project", "init-loader", options, "module")])
  ).toEqual([{ status: "rejected", reason: undefined }]);
});

it("preserves processing failures after successful response handling clears its controller", async () => {
  const { store, request, extractRelations } = setup();
  const failure = new Error("Response processing failed");
  request.mockResolvedValue(response);
  extractRelations.mockImplementation(() => {
    throw failure;
  });
  await expect(store.fetchIssues("workspace", "project", "init-loader", options, "module")).rejects.toBe(failure);
  expect(store.getIssueLoader()).toBeUndefined();
});
