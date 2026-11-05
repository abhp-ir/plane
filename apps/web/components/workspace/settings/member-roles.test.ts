// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ChangeEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { EUserPermissions } from "@plane/constants";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import type { RowData as ProjectRow } from "@/components/project/settings/member-columns";
import { AccountTypeColumn as ProjectRole } from "@/components/project/settings/member-columns";
import type { RowData as WorkspaceRow } from "./member-columns";
import { AccountTypeColumn as WorkspaceRole } from "./member-columns";

const mocks = vi.hoisted(() => ({ editable: true, workspace: vi.fn(), project: vi.fn(), toast: vi.fn() }));
vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { id: "viewer" } }),
  useUserPermissions: () => ({
    allowPermissions: () => mocks.editable,
    getProjectRoleByWorkspaceSlugAndProjectId: () => (mocks.editable ? 20 : 15),
  }),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({
    workspace: {
      updateMember: mocks.workspace,
      getWorkspaceMemberDetails: (id: string) => ({ role: id === "subject" ? 15 : 20 }),
    },
    project: { updateMemberRole: mocks.project },
  }),
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.toast }));
vi.mock("@plane/blocks/select", () => {
  type Props<T> = {
    children: ReactNode;
    getValues: () => T[];
    getOptionValue: (option: T) => string;
    getOptionLabel: (option: T) => string;
    value: T | null;
    onChange: (value: string) => void;
  };
  const Select = <T>({ children, getValues, getOptionValue, getOptionLabel, value, onChange }: Props<T>) =>
    createElement(
      "div",
      null,
      children,
      createElement(
        "select",
        {
          value: value ? getOptionValue(value) : "",
          onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.currentTarget.value),
        },
        getValues().map((option) =>
          createElement(
            "option",
            {
              key: getOptionValue(option),
              value: getOptionValue(option),
            },
            getOptionLabel(option)
          )
        )
      )
    );
  return {
    Select: Object.assign(Select, {
      Trigger: ({ children }: { children: ReactNode }) => createElement("button", { type: "button" }, children),
    }),
  };
});

const row: WorkspaceRow & ProjectRow = {
  member: {
    id: "subject",
    member: {
      id: "subject",
      avatar_url: "",
      display_name: "Imported Alex",
      first_name: "Alex",
      last_name: "",
      is_bot: false,
    },
    role: EUserWorkspaceRoles.MEMBER,
    joining_date: "2025-03-20",
  },
  is_active: true,
  role: EUserPermissions.MEMBER,
  original_role: EUserProjectRoles.MEMBER,
};
Object.freeze(row);

async function mounted(
  run: (container: HTMLDivElement, render: (children: ReactNode) => Promise<void>) => Promise<void>
) {
  await initPromise;
  await setLanguage("fa");
  mocks.workspace.mockReset().mockResolvedValue(undefined);
  mocks.project.mockReset().mockResolvedValue(undefined);
  mocks.toast.mockClear();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await run(container, async (children) => {
      await act(async () => root.render(createElement(TranslationProvider, null, children)));
    });
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
}

it.each([
  ["workspace", true],
  ["workspace", false],
  ["project", true],
  ["project", false],
] as const)("switches the mounted %s role label, editable=%s, without changing membership", async (scope, editable) => {
  mocks.editable = editable;
  await mounted(async (container, render) => {
    await render(
      scope === "workspace"
        ? createElement(WorkspaceRole, { rowData: row, workspaceSlug: "workspace" })
        : createElement(ProjectRole, {
            rowData: row,
            workspaceSlug: "workspace",
            projectId: "project",
            currentProjectRole: EUserPermissions.ADMIN,
          })
    );
    const checkLocale = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      const selectedLabel = container.querySelector("button")?.textContent ?? container.textContent;
      expect(selectedLabel).toBe(locale === "fa" ? "عضو" : "Member");
      const select = container.querySelector<HTMLSelectElement>("select");
      if (editable) {
        expect(select?.value).toBe("15");
        expect([...select!.options].map((option) => [option.value, option.textContent])).toEqual(
          locale === "fa"
            ? [
                ["5", "مهمان"],
                ["15", "عضو"],
                ["20", "مدیر"],
              ]
            : [
                ["5", "Guest"],
                ["15", "Member"],
                ["20", "Admin"],
              ]
        );
      } else expect(select).toBeNull();
    };
    await checkLocale("fa");
    await checkLocale("en");
    await checkLocale("fa");
    expect(mocks.workspace).not.toHaveBeenCalled();
    expect(mocks.project).not.toHaveBeenCalled();
    if (editable) {
      await act(async () => {
        const select = container.querySelector<HTMLSelectElement>("select")!;
        select.value = "20";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      if (scope === "workspace") {
        expect(mocks.workspace).toHaveBeenCalledExactlyOnceWith("workspace", "subject", { role: 20 });
        expect(mocks.project).not.toHaveBeenCalled();
      } else {
        expect(mocks.project).toHaveBeenCalledExactlyOnceWith("workspace", "project", "subject", 20);
        expect(mocks.workspace).not.toHaveBeenCalled();
      }
    }
    expect(row.role).toBe(EUserPermissions.MEMBER);
    expect(row.original_role).toBe(EUserProjectRoles.MEMBER);
    expect(row.member.member.display_name).toBe("Imported Alex");
  });
});

it("switches a suspended workspace role label without exposing an editor or changing membership", async () => {
  mocks.editable = true;
  await mounted(async (container, render) => {
    await render(createElement(WorkspaceRole, { rowData: { ...row, is_active: false }, workspaceSlug: "workspace" }));
    const checkLocale = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      expect(container.textContent).toBe(locale === "fa" ? "تعلیق‌شده" : "Suspended");
      expect(container.querySelector("select")).toBeNull();
    };
    await checkLocale("fa");
    await checkLocale("en");
    await checkLocale("fa");
    expect(mocks.workspace).not.toHaveBeenCalled();
    expect(mocks.project).not.toHaveBeenCalled();
  });
});

it.each(["workspace", "project"] as const)(
  "shows Persian feedback when a %s role request fails without a response",
  async (scope) => {
    mocks.editable = true;
    await mounted(async (container, render) => {
      const update = scope === "workspace" ? mocks.workspace : mocks.project;
      update.mockRejectedValue(undefined);
      await render(
        scope === "workspace"
          ? createElement(WorkspaceRole, { rowData: row, workspaceSlug: "workspace" })
          : createElement(ProjectRole, {
              rowData: row,
              workspaceSlug: "workspace",
              projectId: "project",
              currentProjectRole: EUserPermissions.ADMIN,
            })
      );
      await act(async () => {
        const select = container.querySelector<HTMLSelectElement>("select")!;
        select.value = "20";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(update).toHaveBeenCalledTimes(1);
      expect(mocks.toast).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          type: "error",
          message: "هنگام به‌روزرسانی نقش عضو خطایی رخ داد. دوباره تلاش کنید.",
        })
      );
      expect(row.role).toBe(EUserPermissions.MEMBER);
      expect(row.original_role).toBe(EUserProjectRoles.MEMBER);
    });
  }
);
