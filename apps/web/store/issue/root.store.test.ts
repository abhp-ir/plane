/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { autorun } from "mobx";
import { expect, it, vi } from "vitest";
import type { RootStore } from "../root.store";
import { RouterStore } from "../router.store";
import { IssueRootStore } from "./root.store";

const { EmptyStore } = vi.hoisted(() => ({ EmptyStore: vi.fn() }));

vi.mock("@/store/issue/issue-details/root.store", () => ({ IssueDetail: EmptyStore }));
vi.mock("./archived", () => ({ ArchivedIssuesFilter: EmptyStore, ArchivedIssues: EmptyStore }));
vi.mock("./cycle", () => ({ CycleIssuesFilter: EmptyStore, CycleIssues: EmptyStore }));
vi.mock("./issue.store", () => ({ IssueStore: EmptyStore }));
vi.mock("./issue_calendar_view.store", () => ({ CalendarStore: EmptyStore }));
vi.mock("./issue_kanban_view.store", () => ({ IssueKanBanViewStore: EmptyStore }));
vi.mock("./module", () => ({ ModuleIssuesFilter: EmptyStore, ModuleIssues: EmptyStore }));
vi.mock("./profile", () => ({ ProfileIssuesFilter: EmptyStore, ProfileIssues: EmptyStore }));
vi.mock("./project", () => ({ ProjectIssuesFilter: EmptyStore, ProjectIssues: EmptyStore }));
vi.mock("./project-views", () => ({ ProjectViewIssuesFilter: EmptyStore, ProjectViewIssues: EmptyStore }));
vi.mock("./workspace", () => ({ WorkspaceIssuesFilter: EmptyStore }));
vi.mock("./workspace/issue.store", () => ({ WorkspaceIssues: EmptyStore }));
vi.mock("./workspace-draft", () => ({ WorkspaceDraftIssues: EmptyStore, WorkspaceDraftIssuesFilter: EmptyStore }));

it("keeps observed issue routes tracking router changes without action warnings", () => {
  const router = new RouterStore();
  const store = new IssueRootStore({ router } as RootStore);
  const observedRoutes: Array<[string | undefined, string | undefined]> = [];
  const dispose = autorun(() => {
    observedRoutes.push([store.workspaceSlug, store.projectId]);
  });
  const warn = vi.spyOn(console, "warn");

  try {
    router.setQuery({ workspaceSlug: "workspace-a", projectId: "project-a" });
    router.setQuery({ workspaceSlug: "workspace-a", projectId: "project-b" });
    router.setQuery({ workspaceSlug: "workspace-b", projectId: "project-b" });
    router.setQuery({ workspaceSlug: "workspace-b" });
    router.setQuery({});
    router.setQuery({ workspaceSlug: "workspace-c", projectId: "project-c" });
    router.setQuery({});

    expect(observedRoutes).toEqual([
      [undefined, undefined],
      ["workspace-a", "project-a"],
      ["workspace-a", "project-b"],
      ["workspace-b", "project-b"],
      ["workspace-b", undefined],
      [undefined, undefined],
      ["workspace-c", "project-c"],
      [undefined, undefined],
    ]);
    expect(
      warn.mock.calls.filter(
        ([message]) => typeof message === "string" && /IssueRootStore@\d+\.(workspaceSlug|projectId)\b/.test(message)
      )
    ).toEqual([]);
  } finally {
    dispose();
    warn.mockRestore();
  }
});

it.each(["teamspaceId", "cycleId", "moduleId", "viewId", "globalViewId", "userId"] as const)(
  "keeps observed %s tracking through route resets without action warnings",
  (field) => {
    const router = new RouterStore();
    const store = new IssueRootStore({ router } as RootStore);
    const values: Array<string | undefined> = [];
    const dispose = autorun(() => values.push(store[field]));
    const warn = vi.spyOn(console, "warn");
    try {
      router.setQuery({ [field]: "route-a" });
      router.setQuery({});
      router.setQuery({ [field]: "route-b" });
      router.setQuery({});
      expect(values).toEqual([undefined, "route-a", undefined, "route-b", undefined]);
      expect(
        warn.mock.calls.filter(
          ([message]) => typeof message === "string" && new RegExp(`IssueRootStore@\\d+\\.${field}\\b`).test(message)
        )
      ).toEqual([]);
    } finally {
      dispose();
      warn.mockRestore();
    }
  }
);
