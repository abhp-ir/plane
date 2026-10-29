/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import type { TIssuesResponse } from "@plane/types";
import type { IArchivedIssuesFilter } from "./archived/filter.store";
import { ArchivedIssues } from "./archived/issue.store";
import type { IProjectViewIssuesFilter } from "./project-views/filter.store";
import { ProjectViewIssues } from "./project-views/issue.store";
import type { IIssueRootStore } from "./root.store";

vi.mock("@/lib/store-context", () => ({ store: {} }));

const response = {
  results: [],
  total_count: 0,
  prev_cursor: "",
  next_cursor: "",
  next_page_results: false,
} as unknown as TIssuesResponse;
const options = { perPageCount: 4, canGroup: true };

const setup = (type: "project-view" | "archived") => {
  const addIssue = vi.fn();
  const extractRelations = vi.fn();
  const root = {
    rootStore: { router: {}, projectRoot: { project: { fetchProjectDetails: vi.fn() } } },
    issues: { addIssue, getIssuesByIds: () => [] },
    issueDetail: { relation: { extractRelationsFromIssues: extractRelations } },
  } as unknown as IIssueRootStore;
  const getFilterParams = vi.fn(() => ({ expand: "" }));
  const store =
    type === "project-view"
      ? new ProjectViewIssues(root, { getFilterParams } as unknown as IProjectViewIssuesFilter)
      : new ArchivedIssues(root, { getFilterParams } as unknown as IArchivedIssuesFilter);
  const pending: {
    signal: AbortSignal;
    resolve: (value: TIssuesResponse) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const request = vi.fn(
    (_workspace: string, _project: string, _query: unknown, config?: { signal?: AbortSignal }) =>
      new Promise<TIssuesResponse>((resolve, reject) => {
        if (!config?.signal) throw new Error("Issue fetch must pass its request signal");
        pending.push({ signal: config.signal, resolve, reject });
      })
  );
  if (store instanceof ProjectViewIssues) vi.spyOn(store.issueService, "getIssues").mockImplementation(request);
  else vi.spyOn(store.issueArchiveService, "getArchivedIssues").mockImplementation(request);
  const fetch = () =>
    store instanceof ProjectViewIssues
      ? store.fetchIssues("workspace", "project", "view", "init-loader", options)
      : store.fetchIssues("workspace", "project", "init-loader", options);
  return { store, pending, addIssue, extractRelations, request, getFilterParams, fetch };
};

describe.each(["project-view", "archived"] as const)("%s request ownership", (type) => {
  it("resolves an aborted obsolete request without clearing its successor's loader", async () => {
    const { store, pending, addIssue, getFilterParams, fetch } = setup(type);
    const obsolete = Promise.allSettled([fetch()]);
    const latest = fetch();
    expect(pending[0].signal.aborted).toBe(true);
    pending[0].reject(undefined); // Existing services map canceled Axios errors to response?.data.
    const outcome = await obsolete;
    const loaderWhileLatestPending = store.getIssueLoader();
    pending[1].resolve(response);
    await latest;
    expect(outcome).toEqual([{ status: "fulfilled", value: undefined }]);
    expect(loaderWhileLatestPending).toBe("init-loader");
    expect(addIssue).toHaveBeenCalledTimes(1);
    expect(getFilterParams).toHaveBeenNthCalledWith(
      1,
      options,
      type === "project-view" ? "view" : "project",
      undefined,
      undefined,
      undefined
    );
  });

  it("ignores stale success without processing data or canceling the latest request", async () => {
    const { pending, addIssue, fetch } = setup(type);
    const obsolete = fetch();
    const latest = fetch();
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

  it("preserves genuine failures, including undefined without cancellation", async () => {
    const { store, request, fetch } = setup(type);
    const failure = { detail: "Permission denied" };
    request.mockRejectedValueOnce(failure).mockRejectedValueOnce(undefined);
    await expect(fetch()).rejects.toBe(failure);
    expect(store.getIssueLoader()).toBeUndefined();
    expect(await Promise.allSettled([fetch()])).toEqual([{ status: "rejected", reason: undefined }]);
  });

  it("preserves processing failures after successful handling clears its controller", async () => {
    const { store, request, extractRelations, fetch } = setup(type);
    const failure = new Error("Response processing failed");
    request.mockResolvedValue(response);
    extractRelations.mockImplementation(() => {
      throw failure;
    });
    await expect(fetch()).rejects.toBe(failure);
    expect(store.getIssueLoader()).toBeUndefined();
  });
});
