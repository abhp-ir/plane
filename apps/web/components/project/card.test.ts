// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IProject } from "@plane/types";
import type { TContextMenuItem } from "@plane/blocks/context-menu";
import { ProjectCard } from "./card";

vi.mock("@plane/i18n", async () => {
  const { createRequire } = await import("node:module");
  // Use the established CJS ICU test boundary; real Vite/browser ICU output is checked separately.
  const webRequire = createRequire(`${process.cwd()}/package.json`);
  const require = createRequire(webRequire.resolve("@plane/i18n"));
  const { createInstance } = require("i18next");
  const ICU = require("i18next-icu").default;
  const reactI18next = require("react-i18next");
  const instance = createInstance();
  const ready = instance
    .use(ICU)
    .use(reactI18next.initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      resources: {
        fa: { translation: (await import("../../../../packages/i18n/src/locales/fa/common.json")).default },
        en: { translation: (await import("../../../../packages/i18n/src/locales/en/common.json")).default },
      },
      interpolation: { escapeValue: false },
    });
  return {
    initPromise: ready,
    setLanguage: (language: string) => instance.changeLanguage(language),
    TranslationProvider: ({ children }: { children: ReactNode }) =>
      createElement(reactI18next.I18nextProvider, { i18n: instance }, children),
    useTranslation: () => {
      const { t, i18n } = reactI18next.useTranslation();
      return { t, currentLocale: i18n.language };
    },
  };
});

const mocks = vi.hoisted(() => ({ join: vi.fn(), push: vi.fn(), menu: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned" }) }));
vi.mock("@/hooks/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: () => undefined }) }));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({}) }));
vi.mock("@/hooks/store/user", () => ({ useUserPermissions: () => ({ allowPermissions: () => false }) }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@/components/common/cover-image", () => ({ CoverImage: () => null }));
vi.mock("@plane/blocks/emoji-icon-picker", () => ({ Logo: () => null }));
vi.mock("@plane/blocks/context-menu", () => ({
  ContextMenu: ({ items }: { items: TContextMenuItem[] }) => {
    mocks.menu(items);
    return null;
  },
}));
vi.mock("./delete-project-modal", () => ({ DeleteProjectModal: () => null }));
vi.mock("./archive-restore-modal", () => ({ ArchiveRestoreProjectModal: () => null }));
vi.mock("./join-project-modal", () => ({
  JoinProjectModal: ({ isOpen }: { isOpen: boolean }) => {
    mocks.join(isOpen);
    return null;
  },
}));

const fixture: IProject = {
  id: "project",
  name: "آزمون ABC-42",
  identifier: "FA",
  description: "",
  created_at: new Date(2025, 2, 20, 12),
  member_role: 20,
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

it.each([true, false])(
  "keeps native project links separate from actions and preserves membership=%s",
  async (member) => {
    await initPromise;
    await setLanguage("fa");
    const project = { ...fixture, member_role: member ? 20 : null };
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
      const checkLanguage = async (language: "fa" | "en") => {
        await act(async () => setLanguage(language));
        const copy = container.querySelector<HTMLButtonElement>(
          `button[aria-label="${language === "fa" ? "کپی پیوند" : "Copy link"}"]`
        );
        expect(copy).not.toBeNull();
        expect(primary.getAttribute("aria-label")).toBe(project.name);
        const menu = (mocks.menu.mock.lastCall![0] as TContextMenuItem[]).filter((item) => item.shouldRender);
        expect(menu.map((item) => item.key)).toEqual(
          member ? ["settings", "copy-link"] : ["join", "open-new-tab", "copy-link"]
        );
        expect(menu.map((item) => item.title)).toEqual(
          language === "fa"
            ? member
              ? ["تنظیمات", "کپی پیوند"]
              : ["عضویت", "باز کردن در زبانهٔ جدید", "کپی پیوند"]
            : member
              ? ["Settings", "Copy link"]
              : ["Join", "Open in new tab", "Copy link"]
        );
      };
      await checkLanguage("fa");
      await checkLanguage("en");
      await checkLanguage("fa");
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

it.each([
  { role: 5, archived: false, members: 12 },
  { role: 15, archived: false, members: 1 },
  { role: 20, archived: true, members: 0 },
  { role: 5, archived: true, members: 0 },
])(
  "preserves role=$role archive=$archived controls and localizes $members members",
  async ({ role, archived, members }) => {
    await initPromise;
    const project = {
      ...fixture,
      member_role: role,
      archived_at: archived ? "2025-03-21T00:00:00Z" : null,
      members: Array.from({ length: members }, (_, index) => `member-${index}`),
    };
    const before = structuredClone(project);
    try {
      const checkLanguage = async (language: "fa" | "en") => {
        await setLanguage(language);
        const html = renderToStaticMarkup(
          createElement(
            MemoryRouter,
            null,
            createElement(TranslationProvider, null, createElement(ProjectCard, { project }))
          )
        );
        expect(html).toContain("<bdi>آزمون ABC-42</bdi>");
        expect(html).toContain('<bdi dir="ltr">FA</bdi>');
        expect(html).toContain(
          language === "fa"
            ? `${new Intl.NumberFormat("fa").format(members)} عضو`
            : `${members} member${members === 1 ? "" : "s"}`
        );
        const keys = (mocks.menu.mock.lastCall![0] as TContextMenuItem[])
          .filter((item) => item.shouldRender)
          .map((item) => item.key);
        expect(keys).toEqual(
          archived
            ? role === 20
              ? ["restore", "delete"]
              : []
            : role === 15
              ? ["settings", "copy-link"]
              : ["copy-link"]
        );
        if (archived && role === 20) {
          expect(html).toContain(`aria-label="${language === "fa" ? "حذف" : "Delete"}"`);
          expect(html).toContain(language === "fa" ? "بازیابی" : "Restore");
        } else if (!archived && role === 5) expect(html).toContain(language === "fa" ? "عضو شده‌اید" : "Joined");
        expect(project).toEqual(before);
      };
      await checkLanguage("fa");
      await checkLanguage("en");
      await checkLanguage("fa");
    } finally {
      await setLanguage("en");
    }
  }
);
