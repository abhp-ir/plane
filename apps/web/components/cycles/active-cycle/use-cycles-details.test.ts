// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { SWRConfig } from "swr";
import { expect, it, vi } from "vitest";
import useCyclesDetails from "./use-cycles-details";

const mocks = vi.hoisted(() => ({
  analytics: vi.fn(async () => ({})),
  progress: vi.fn(async () => ({})),
  issues: vi.fn(async () => ({})),
}));
const cycle = observable({
  id: "draft-cycle",
  start_date: null as string | null,
  end_date: null as string | null,
  distribution: undefined,
  estimate_distribution: undefined,
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/store/use-cycle", () => ({
  useCycle: () => ({
    getCycleById: () => cycle,
    fetchActiveCycleAnalytics: mocks.analytics,
    fetchActiveCycleProgress: mocks.progress,
  }),
}));
vi.mock("@/hooks/store/use-issues", () => ({
  useIssues: () => ({
    issuesFilter: { updateFilterExpression: vi.fn() },
    issues: { getActiveCycleById: () => ({}), fetchActiveCycleIssues: mocks.issues },
  }),
}));
vi.mock("@/hooks/store/work-item-filters/use-work-item-filters", () => ({
  useWorkItemFilters: () => ({ updateFilterExpressionFromConditions: vi.fn() }),
}));

it("keeps draft progress/issues available and fetches analytics only once both stored dates exist", async () => {
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const Probe = observer(function Probe() {
    useCyclesDetails({ workspaceSlug: "workspace", projectId: "project", cycleId: cycle.id });
    return null;
  });
  try {
    await act(async () =>
      root.render(createElement(SWRConfig, { value: { provider: () => new Map() } }, createElement(Probe)))
    );
    expect(mocks.analytics).not.toHaveBeenCalled();
    expect(mocks.progress).toHaveBeenCalledWith("workspace", "project", "draft-cycle");
    expect(mocks.issues).toHaveBeenCalledWith("workspace", "project", 30, "draft-cycle");
    await act(async () =>
      runInAction(() => {
        cycle.start_date = "2026-10-24";
      })
    );
    expect(mocks.analytics).not.toHaveBeenCalled();
    await act(async () =>
      runInAction(() => {
        cycle.end_date = "2026-11-01";
      })
    );
    expect(mocks.analytics).toHaveBeenCalledTimes(2);
    expect(mocks.analytics).toHaveBeenCalledWith("workspace", "project", "draft-cycle", "issues");
    expect(mocks.analytics).toHaveBeenCalledWith("workspace", "project", "draft-cycle", "points");
    await act(async () =>
      runInAction(() => {
        cycle.start_date = null;
      })
    );
    expect(mocks.analytics).toHaveBeenCalledTimes(2);
    expect(cycle.end_date).toBe("2026-11-01");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
