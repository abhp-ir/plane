// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { TPageVersion } from "@plane/types";
import { EPageStoreType } from "@/hooks/store/use-page-store";
import type { TPageInstance } from "@/store/pages/base-page";
import { PageArchivedBadge } from "./header/archived-badge";
import { BlockItemAction } from "./list/block-item-action";
import { PageNavigationPaneInfoTabActorsInfo } from "./navigation-pane/tab-panels/info/actors-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./navigation-pane/tab-panels/info/version-history";
import { PageVersionsMainContent } from "./version/main-content";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ workspaceSlug: "owned" }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/pages/navigation-pane", () => ({ PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM: "version" }));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({ getUserDetails: () => ({ display_name: "نگار ABC-42", avatar_url: "" }) }),
}));
vi.mock("@/hooks/use-page-operations", () => ({ usePageOperations: () => ({ pageOperations: {} }) }));
vi.mock("@/hooks/use-query-params", () => ({
  useQueryParams: () => ({
    updateQueryParams: ({ paramsToAdd }: { paramsToAdd?: { version: string } }) =>
      paramsToAdd ? `?paneTab=info&version=${paramsToAdd.version}` : "?paneTab=info",
  }),
}));
vi.mock("./dropdowns", () => ({ PageActions: () => null }));
vi.mock("@makeplane/propel/components/tooltip", () => ({
  Tooltip: ({ label, children }: { label: string; children: ReactNode }) =>
    createElement("span", { "data-tooltip": label }, children),
}));
vi.mock("swr", () => ({
  default: (key: string) => ({
    data: key.startsWith("PAGE_VERSIONS_LIST_") ? [version] : version,
    mutate: mocks.mutate,
  }),
}));

const version: TPageVersion = {
  id: "version",
  page: "page",
  workspace: "owned",
  owned_by: "creator",
  created_by: "creator",
  updated_by: "creator",
  created_at: "2025-03-20T22:00:00Z",
  updated_at: "2025-03-20T22:00:00Z",
  last_saved_at: "2025-03-20T22:00:00Z",
  deleted_at: null,
  description_html: "<p>متن ABC-42 می‌رود</p>",
};

// Only metadata is read; editor, stores, tooltip rendering and version fetching are fixture boundaries.
const page = {
  id: "page",
  created_at: new Date(2025, 2, 20, 12),
  updated_at: new Date(2025, 2, 20, 12),
  archived_at: "2025-03-20",
  owned_by: "creator",
  created_by: "creator",
  updated_by: "creator",
  access: 0,
  is_favorite: false,
  canCurrentUserFavoritePage: false,
} as TPageInstance;

it.each(["actors", "history", "version", "list", "archive"])(
  "updates the mounted Page %s date without changing content or timestamps",
  async (surface) => {
    await initPromise;
    await setLanguage("en");
    const before = JSON.stringify({ page, version });
    const handlers = { fetchAllVersions: vi.fn(), fetchVersionDetails: vi.fn() };
    const restore = vi.fn();
    const components: Record<string, ReactNode> = {
      actors: createElement(PageNavigationPaneInfoTabActorsInfo, { page }),
      history: createElement(PageNavigationPaneInfoTabVersionHistory, { page, versionHistory: handlers }),
      version: createElement(PageVersionsMainContent, {
        activeVersion: version.id,
        editorComponent: () => null,
        fetchVersionDetails: handlers.fetchVersionDetails,
        handleClose: vi.fn(),
        handleRestore: restore,
        pageId: "page",
        restoreEnabled: false,
        storeType: EPageStoreType.PROJECT,
      }),
      list: createElement(BlockItemAction, {
        page,
        parentRef: { current: null },
        storeType: EPageStoreType.PROJECT,
      }),
      archive: createElement(PageArchivedBadge, { page }),
    };
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const displayed = () =>
      [
        container.textContent,
        ...Array.from(container.querySelectorAll("[data-tooltip]"), (node) => node.getAttribute("data-tooltip")),
      ].join(" ");
    try {
      await act(async () =>
        root.render(createElement(MemoryRouter, null, createElement(TranslationProvider, null, components[surface])))
      );
      expect(displayed()).toContain("Mar 20, 2025");
      await act(async () => setLanguage("fa"));
      expect(displayed()).toContain("اسف ۳۰, ۱۴۰۳");
      expect(displayed()).not.toContain("Mar 20, 2025");
      if (surface === "actors" || surface === "history") expect(container.textContent).toContain("نگار ABC-42");
      if (surface === "history") {
        expect(container.querySelector("a[href*='version=version']")).not.toBeNull();
      }
      if (surface === "archive") expect(container.textContent).toBe("تاریخ بایگانی اسف ۳۰, ۱۴۰۳");
      if (surface === "list") expect(displayed()).not.toContain("Created on");
      await act(async () => setLanguage("en"));
      expect(displayed()).toContain("Mar 20, 2025");
      expect(JSON.stringify({ page, version })).toBe(before);
      expect(restore).not.toHaveBeenCalled();
      expect(mocks.mutate).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);

it("does not show an archive badge for an active Page", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  await initPromise;
  expect(
    renderToStaticMarkup(
      createElement(
        TranslationProvider,
        null,
        createElement(PageArchivedBadge, { page: { ...page, archived_at: null } })
      )
    )
  ).toBe("");
});
