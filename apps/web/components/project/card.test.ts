// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IProject } from "@plane/types";
import { ProjectCard } from "./card";

const mocks = vi.hoisted(() => ({ join: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned" }) }));
vi.mock("@/hooks/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: () => undefined }) }));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({}) }));
vi.mock("@/hooks/store/user", () => ({ useUserPermissions: () => ({ allowPermissions: () => false }) }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/components/common/cover-image", () => ({ CoverImage: () => null }));
vi.mock("@plane/blocks/emoji-icon-picker", () => ({ Logo: () => null }));
vi.mock("@plane/blocks/context-menu", () => ({ ContextMenu: () => null }));
vi.mock("./delete-project-modal", () => ({ DeleteProjectModal: () => null }));
vi.mock("./archive-restore-modal", () => ({ ArchiveRestoreProjectModal: () => null }));
vi.mock("./join-project-modal", () => ({
  JoinProjectModal: ({ isOpen }: { isOpen: boolean }) => {
    mocks.join(isOpen);
    return null;
  },
}));

it.each([true, false])(
  "keeps native project links separate from actions and preserves membership=%s",
  async (member) => {
    await initPromise;
    await setLanguage("fa");
    const project: IProject = {
      id: "project",
      name: "آزمون ABC-42",
      identifier: "FA",
      description: "",
      created_at: new Date(2025, 2, 20, 12),
      member_role: member ? 20 : null,
      archived_at: null,
      members: [],
      sort_order: 1,
      logo_props: { in_use: "emoji" },
      workspace: "owned",
      cycle_view: true,
      issue_views_view: true,
      module_view: true,
      page_view: true,
      inbox_view: false,
    };
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          createElement(
            MemoryRouter,
            null,
            createElement(TranslationProvider, null, createElement(ProjectCard, { project }))
          )
        )
      );
      expect(container.querySelectorAll("a a, a button, a [role=button]")).toHaveLength(0);
      const primary = container.querySelector<HTMLAnchorElement>('a[href="/owned/projects/project/issues/"]')!;
      expect(primary.getAttribute("aria-label")).toBe(project.name);
      expect(container.textContent).toContain("تاریخ ایجاد اسف ۳۰, ۱۴۰۳");
      if (member) {
        const settings = container.querySelector<HTMLAnchorElement>('a[href="/owned/settings/projects/project/"]')!;
        expect(settings).not.toBeNull();
        settings.focus();
        expect(document.activeElement).toBe(settings);
      } else {
        const click = new MouseEvent("click", { bubbles: true, cancelable: true });
        await act(async () => primary.dispatchEvent(click));
        expect(click.defaultPrevented).toBe(true);
        expect(mocks.join).toHaveBeenLastCalledWith(true);
        expect(mocks.push).not.toHaveBeenCalled();
      }
    } finally {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
