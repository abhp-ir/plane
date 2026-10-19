// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { observer } from "mobx-react";
import { expect, it, vi } from "vitest";
import { WorkItemFilterStore } from "@plane/shared-state";
import type { IIssueFilters, TWorkItemFilterProperty } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { getPriorityFilterConfig } from "@plane/utils";
import { WorkItemFiltersHOC } from "./base";

const mocks = vi.hoisted(() => ({ store: undefined as WorkItemFilterStore | undefined, ready: false }));
vi.mock("@/hooks/store/work-item-filters/use-work-item-filters", () => ({
  useWorkItemFilters: () => mocks.store,
}));
const configs = [
  getPriorityFilterConfig<TWorkItemFilterProperty>("priority")({ isEnabled: true, allowedOperators: new Set() }),
];
vi.mock("@/hooks/work-item-filters/use-work-item-filters-config", () => ({
  useWorkItemFiltersConfig: () => ({ areAllConfigsInitialized: mocks.ready, configs }),
}));
const props = {
  entityType: EIssuesStoreType.PROJECT,
  entityId: "project",
  workspaceSlug: "workspace",
  filtersToShowByLayout: ["priority"] as TWorkItemFilterProperty[],
  initialWorkItemFilters: { richFilters: { priority__in: "high" } } as IIssueFilters,
  updateFilters: vi.fn(),
  children: () => null,
};

it("does not publish a filter from a render that never commits", () => {
  const store = new WorkItemFilterStore();
  mocks.store = store;
  renderToString(createElement(WorkItemFiltersHOC, props));
  expect(store.filters.size).toBe(0);
});

it("initializes after commit, keeps live options and expressions, and cleans up identities in StrictMode", async () => {
  const store = new WorkItemFilterStore();
  mocks.store = store;
  mocks.ready = false;
  const Toggle = observer(function Toggle() {
    const filter = store.getFilter(props.entityType, props.entityId);
    return createElement("output", null, filter?.isVisible ? "visible" : "hidden");
  });
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const errors = vi.spyOn(console, "error");
  const saveViewOptions = { isDisabled: false, onViewSave: vi.fn() };
  const updateViewOptions = { isDisabled: false, onViewUpdate: vi.fn() };
  const render = async (overrides: Partial<Parameters<typeof WorkItemFiltersHOC>[0]> = {}) =>
    act(async () =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(Toggle),
          createElement(WorkItemFiltersHOC, { ...props, saveViewOptions, updateViewOptions, ...overrides })
        )
      )
    );
  try {
    await render({ initialWorkItemFilters: undefined });
    expect(store.filters.size).toBe(0);
    await render({ showOnMount: true });
    const filter = store.getFilter(props.entityType, props.entityId)!;
    expect(filter).toBeDefined();
    expect(store.filters.size).toBe(1);
    expect(container.querySelector("output")?.textContent).toBe("visible");
    expect(filter.allConditions).toMatchObject([{ property: "priority", value: "high" }]);
    expect(filter.configManager.getConfigByProperty("priority")?.isEnabled).toBe(true);
    expect(filter.configManager.areConfigsReady).toBe(false);
    expect(props.updateFilters).not.toHaveBeenCalled();
    const updateFilters = vi.fn();
    mocks.ready = true;
    await render({
      updateFilters,
      saveViewOptions: { ...saveViewOptions, isDisabled: true },
      updateViewOptions: { ...updateViewOptions, isDisabled: true },
      initialWorkItemFilters: { richFilters: { priority__in: "low" } } as IIssueFilters,
    });
    expect(store.getFilter(props.entityType, props.entityId)).toBe(filter);
    expect(filter.allConditions).toMatchObject([{ property: "priority", value: "high" }]);
    expect(filter.saveViewOptions?.isDisabled).toBe(true);
    expect(filter.updateViewOptions?.isDisabled).toBe(true);
    expect(filter.configManager.areConfigsReady).toBe(true);
    await act(async () => filter.resetExpression({ priority__in: "urgent" }));
    expect(updateFilters).toHaveBeenCalledExactlyOnceWith({ priority__in: "urgent" });
    await render({ entityId: "other" });
    expect(store.getFilter(props.entityType, props.entityId)).toBeUndefined();
    expect(store.getFilter(props.entityType, "other")).toBeDefined();
    await render({ isTemporary: true });
    expect(store.getFilter(props.entityType, "other")).toBeUndefined();
    expect(store.getFilter(props.entityType, "TEMP-project")).toBeDefined();
    await render({ isTemporary: true, entityId: undefined });
    expect(store.getFilter(props.entityType, "TEMP-project")).toBeUndefined();
    const anonymousKey = [...store.filters.keys()][0];
    expect(anonymousKey).toMatch(/^PROJECT-TEMP-/);
    await render({ isTemporary: true, entityId: undefined });
    expect([...store.filters.keys()]).toEqual([anonymousKey]);
    expect(store.filters.size).toBe(1);
    await act(async () => root.unmount());
    expect(store.filters.size).toBe(0);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    errors.mockRestore();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    props.updateFilters.mockClear();
  }
});
