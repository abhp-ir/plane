// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, StrictMode, type ChangeEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { EUserPermissions, ROLE } from "@plane/constants";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { SendProjectInvitationModal } from "./send-project-invitation-modal";

const mocks = vi.hoisted(() => ({ bulkAdd: vi.fn(), close: vi.fn() }));
vi.mock("@plane/i18n", async (importOriginal) => {
  const { createTestTranslation } = await import("@/helpers/__tests__/translation");
  return createTestTranslation(await importOriginal<typeof import("@plane/i18n")>());
});
vi.mock("@/hooks/store/user", () => ({
  useUserPermissions: () => ({ getProjectRoleByWorkspaceSlugAndProjectId: () => 20 }),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({
    project: { getProjectMemberDetails: () => undefined, bulkAddMembersToProject: mocks.bulkAdd },
    workspace: {
      workspaceMemberIds: ["subject"],
      getWorkspaceMemberDetails: () => ({ role: 15, member: { id: "subject", display_name: "Imported Alex" } }),
    },
  }),
}));
vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));
vi.mock("@makeplane/propel/components/dialog", () => {
  const Part = ({ children }: { children?: ReactNode }) => createElement("div", null, children);
  return Object.fromEntries(
    [
      "Dialog",
      "DialogActions",
      "DialogBody",
      "DialogContent",
      "DialogDescription",
      "DialogHeader",
      "DialogHeading",
      "DialogMain",
      "DialogTitle",
    ].map((name) => [name, Part])
  );
});
vi.mock("@makeplane/propel/components/button", () => ({
  Button: ({
    label,
    type = "button",
    onClick,
    loading,
  }: {
    label: string;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    loading?: boolean;
  }) => createElement("button", { type, onClick, disabled: loading }, label),
}));
vi.mock("@/components/dropdowns/member/member-select", () => ({
  MemberSelect: ({
    value,
    onChange,
    memberIds,
  }: {
    value: string | null;
    onChange: (value: string) => void;
    memberIds: string[];
  }) =>
    createElement(
      "select",
      {
        "aria-label": "Member",
        value: value ?? "",
        onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.currentTarget.value),
      },
      createElement("option", { value: "" }, ""),
      ...memberIds.map((id) => createElement("option", { key: id, value: id }, "Imported Alex"))
    ),
}));
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
          "aria-label": "Role",
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
      Trigger: ({ children }: { children: ReactNode }) => createElement("span", null, children),
    }),
  };
});

it("keeps one StrictMode row and translates existing required errors without changing numeric submissions", async () => {
  await initPromise;
  await setLanguage("fa");
  mocks.bulkAdd.mockReset().mockResolvedValue(undefined);
  mocks.close.mockClear();
  const canonicalRoles = { ...ROLE };
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
          StrictMode,
          null,
          createElement(
            TranslationProvider,
            null,
            createElement(SendProjectInvitationModal, {
              isOpen: true,
              onClose: mocks.close,
              workspaceSlug: "workspace",
              projectId: "project",
            })
          )
        )
      )
    );
    expect(container.querySelectorAll('select[aria-label="Member"]')).toHaveLength(1);
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe("افزودن عضو");

    const addMore = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "افزودن موارد بیشتر"
    )!;
    await act(async () => addMore.click());
    expect(container.querySelectorAll('select[aria-label="Member"]')).toHaveLength(2);
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe("افزودن اعضا");
    const remove = container.querySelectorAll<HTMLButtonElement>('button[aria-label="حذف"]');
    await act(async () => remove.item(1).click());
    expect(container.querySelectorAll('select[aria-label="Member"]')).toHaveLength(1);
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe("افزودن عضو");

    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const checkRequired = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      expect(container.textContent).toContain(
        locale === "fa" ? "لطفاً یک عضو را انتخاب کنید" : "Please select a member"
      );
      expect(mocks.bulkAdd).not.toHaveBeenCalled();
    };
    await checkRequired("fa");
    await checkRequired("en");
    await checkRequired("fa");

    await act(async () => {
      const member = container.querySelector<HTMLSelectElement>('select[aria-label="Member"]')!;
      member.value = "subject";
      member.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="Role"]')?.value).toBe("15");
    await act(async () => {
      const role = container.querySelector<HTMLSelectElement>('select[aria-label="Role"]')!;
      expect([...role.options].map((option) => option.value)).toEqual(["5", "15", "20"]);
      role.value = "20";
      role.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const checkSelection = async (locale: "fa" | "en") => {
      await act(async () => setLanguage(locale));
      expect(container.querySelector<HTMLSelectElement>('select[aria-label="Member"]')?.value).toBe("subject");
      expect(container.querySelector<HTMLSelectElement>('select[aria-label="Role"]')?.value).toBe("20");
      expect(mocks.bulkAdd).not.toHaveBeenCalled();
    };
    await checkSelection("en");
    await checkSelection("fa");
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(mocks.bulkAdd).toHaveBeenCalledExactlyOnceWith("workspace", "project", {
      members: [{ member_id: "subject", role: EUserPermissions.ADMIN }],
    });
    expect(ROLE).toEqual(canonicalRoles);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
