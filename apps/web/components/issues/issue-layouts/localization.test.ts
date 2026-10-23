// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { CountChip } from "@/components/common/count-chip";
import { SpreadsheetLinkColumn } from "./spreadsheet/columns/link-column";
import { SpreadsheetAttachmentColumn } from "./spreadsheet/columns/attachment-column";
import { SpreadsheetSubIssueColumn } from "./spreadsheet/columns/sub-issue-column";
import { HeaderGroupByCard as ListGroup } from "./list/headers/group-by-card";
import { HeaderGroupByCard as BoardGroup } from "./kanban/headers/group-by-card";

vi.mock("@plane/i18n", async () => {
  const { createRequire } = await import("node:module");
  // Use the established CJS ICU test boundary; the real browser verifies Vite's output separately.
  const webRequire = createRequire(`${process.cwd()}/package.json`);
  const require = createRequire(webRequire.resolve("@plane/i18n"));
  const { createInstance } = require("i18next");
  const ICU = require("i18next-icu").default;
  const reactI18next = require("react-i18next");
  const instance = createInstance();
  const resources = {
    fa: {
      translation: {
        ...(await import("../../../../../packages/i18n/src/locales/fa/common.json")).default,
        ...(await import("../../../../../packages/i18n/src/locales/fa/work-item.json")).default,
      },
    },
    en: {
      translation: {
        ...(await import("../../../../../packages/i18n/src/locales/en/common.json")).default,
        ...(await import("../../../../../packages/i18n/src/locales/en/work-item.json")).default,
      },
    },
    ua: {
      translation: {
        ...(await import("../../../../../packages/i18n/src/locales/ua/common.json")).default,
        ...(await import("../../../../../packages/i18n/src/locales/ua/work-item.json")).default,
      },
    },
  };
  const ready = instance
    .use(ICU)
    .use(reactI18next.initReactI18next)
    .init({
      lng: "en",
      fallbackLng: "en",
      resources,
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

const mocks = vi.hoisted(() => ({
  params: {} as Record<string, string>,
  submit: undefined as ((data: ISearchIssueResponse[]) => Promise<void>) | undefined,
  toast: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useParams: () => mocks.params }));
vi.mock("@/hooks/use-app-router", () => ({ useAppRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/use-issue-layout-store", () => ({ useIssueStoreType: () => "PROJECT" }));
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.toast }));
vi.mock("@/components/issues/issue-modal/modal", () => ({ CreateUpdateIssueModal: () => null }));
vi.mock("@/components/epic-modal", () => ({ CreateUpdateEpicModal: () => null }));
vi.mock("@/components/core/multiple-select", () => ({ MultipleSelectGroupAction: () => null }));
vi.mock("@/components/core/modals/existing-issues-list-modal", () => ({
  ExistingIssuesListModal: ({ handleOnSubmit }: { handleOnSubmit: typeof mocks.submit }) => {
    mocks.submit = handleOnSubmit;
    return null;
  },
}));

async function mount() {
  await initPromise;
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  return {
    container,
    root,
    async close() {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    },
  };
}

it("updates numeric chips on mounted locale changes while preserving prepared string labels", async () => {
  const view = await mount();
  try {
    await act(async () =>
      view.root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(CountChip, { count: 1234 }),
          createElement(CountChip, { count: 0 }),
          createElement(CountChip, { count: "@ 99+" })
        )
      )
    );
    const check = async (locale: "fa" | "en" | "ua", number: string, zero: string) => {
      await act(async () => setLanguage(locale));
      expect([...view.container.children].map((element) => element.textContent)).toEqual([number, zero, "@ 99+"]);
    };
    await check("fa", "۱٬۲۳۴", "۰");
    await check("en", "1,234", "0");
    await check("ua", "1 234", "0");
    await check("fa", "۱٬۲۳۴", "۰");
  } finally {
    await view.close();
  }
});

it.each([0, 1, 12])("renders localized table count phrases for %s without changing issue data", async (count) => {
  const view = await mount();
  const issue = {
    id: "ABC-42",
    project_id: "project-id",
    link_count: count,
    attachment_count: count,
    sub_issues_count: count,
  } as TIssue;
  const original = structuredClone(issue);
  try {
    await act(async () =>
      view.root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(SpreadsheetLinkColumn, { issue }),
          createElement(SpreadsheetAttachmentColumn, { issue }),
          createElement(SpreadsheetSubIssueColumn, { issue })
        )
      )
    );
    const check = async (language: "fa" | "en") => {
      await act(async () => setLanguage(language));
      const number = new Intl.NumberFormat(language).format(count);
      const expected =
        language === "fa"
          ? [`${number} پیوند`, `${number} پیوست`, `${number} زیرآیتم کاری`]
          : [
              `${number} link${count === 1 ? "" : "s"}`,
              `${number} attachment${count === 1 ? "" : "s"}`,
              `${number} sub-work item${count === 1 ? "" : "s"}`,
            ];
      expect([...view.container.children].map((element) => element.textContent)).toEqual(expected);
      expect(issue).toEqual(original);
    };
    await check("fa");
    await check("en");
    await check("fa");
  } finally {
    await view.close();
  }
});

it.each([
  ["list", "cycle"],
  ["list", "module"],
  ["board", "cycle"],
  ["board", "module"],
] as const)("uses the actual %s group context for %s feedback and localized counts", async (layout, entity) => {
  const view = await mount();
  mocks.params = { workspaceSlug: "workspace", projectId: "project", [`${entity}Id`]: "container-id" };
  mocks.toast.mockClear();
  const addIssues = vi.fn(async () => ({}) as TIssue);
  const items = [{ id: "item-1" }, { id: "item-2" }] as ISearchIssueResponse[];
  try {
    await act(async () => {
      await setLanguage("fa");
      const common = {
        title: "Mixed ABC-42",
        count: 12,
        issuePayload: {},
        disableIssueCreation: true,
        addIssuesToView: addIssues,
      };
      const group =
        layout === "list"
          ? createElement(ListGroup, {
              ...common,
              groupID: "state-id",
              groupBy: "state",
              canEditProperties: () => false,
              selectionHelpers: { isGroupSelected: () => "empty" } as unknown as TSelectionHelper,
              handleCollapsedGroups: vi.fn(),
            })
          : createElement(BoardGroup, {
              ...common,
              column_id: "state-id",
              group_by: "state",
              sub_group_by: undefined,
              collapsedGroups: { group_by: [], sub_group_by: [] },
              handleCollapsedGroups: vi.fn(),
            });
      view.root.render(createElement(TranslationProvider, null, group));
    });
    expect(view.container.textContent).toBe("Mixed ABC-42۱۲");
    await act(async () => mocks.submit!(items));
    expect(addIssues).toHaveBeenLastCalledWith(["item-1", "item-2"]);
    expect(mocks.toast).toHaveBeenLastCalledWith({
      type: "success",
      title: "موفقیت",
      message: `آیتم‌های کاری با موفقیت به ${entity === "module" ? "ماژول" : "چرخه"} اضافه شدند.`,
    });
    addIssues.mockRejectedValueOnce(new Error("Genuine service failure"));
    await act(async () => mocks.submit!(items));
    expect(mocks.toast.mock.lastCall?.[0].type).toBe("error");
    expect(mocks.toast.mock.lastCall?.[0].message).toContain(entity === "module" ? "ماژول" : "چرخه");
    await act(async () => setLanguage("en"));
    expect(view.container.textContent).toBe("Mixed ABC-4212");
    await act(async () => setLanguage("fa"));
    expect(view.container.textContent).toBe("Mixed ABC-42۱۲");
  } finally {
    await view.close();
  }
});
