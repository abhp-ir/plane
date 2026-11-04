/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TProjectFilters } from "@plane/types";
import HeaderFilters from "./filters";
import { ProjectsListMobileHeader } from "@/components/projects/mobile-header";

const state = vi.hoisted(() => ({
  filters: {} as TProjectFilters,
  update: vi.fn(),
  select: undefined as ((key: keyof TProjectFilters, value: string | string[]) => void) | undefined,
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "workspace" }) }));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ workspace: { workspaceMemberIds: [] } }) }));
vi.mock("@/hooks/store/use-project-filter", () => ({
  useProjectFilter: () => ({
    currentWorkspaceFilters: state.filters,
    currentWorkspaceDisplayFilters: {},
    updateFilters: state.update,
  }),
}));
vi.mock("@/components/issues/issue-layouts/filters", () => ({
  FiltersDropdown: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("./dropdowns/order-by", () => ({ ProjectOrderByDropdown: () => null }));
vi.mock("./dropdowns/filters", () => ({
  ProjectFiltersSelection: ({ handleFiltersUpdate }: { handleFiltersUpdate: typeof state.select }) => {
    state.select = handleFiltersUpdate;
    return null;
  },
}));

describe.each([
  ["desktop", HeaderFilters],
  ["mobile", ProjectsListMobileHeader],
] as const)("%s project filters", (_owner, Component) => {
  it.each([
    ["access", ["0"], "2", ["0", "2"]],
    ["access", ["0"], "0", []],
    ["access", ["0"], ["0", "2"], ["2"]],
    ["created_at", ["last_30_days;custom;custom"], "today;custom;custom", ["today;custom;custom"]],
    [
      "created_at",
      ["last_30_days;custom;custom"],
      ["2025-03-20;after", "2025-03-21;before"],
      ["2025-03-20;after", "2025-03-21;before"],
    ],
  ] as [keyof TProjectFilters, string[], string | string[], string[]][])(
    "updates %s through the store without mutating its previous selection",
    (key, previous, value, expected) => {
      const original = [...previous];
      Object.freeze(previous);
      state.filters = { [key]: previous };
      state.update.mockClear();
      renderToStaticMarkup(createElement(Component));
      expect(state.select).toBeTypeOf("function");
      state.select!(key, value);
      expect(state.filters[key]).toEqual(original);
      expect(state.update).toHaveBeenCalledExactlyOnceWith("workspace", { [key]: expected });
      expect(state.update.mock.calls[0][1][key]).not.toBe(previous);
    }
  );
});
