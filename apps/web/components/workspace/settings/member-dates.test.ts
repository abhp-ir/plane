// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { EUserPermissions } from "@plane/constants";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import type { RowData as ProjectRow } from "@/components/projects/settings/useProjectColumns";
import { useProjectColumns } from "@/components/projects/settings/useProjectColumns";
import type { RowData as WorkspaceRow } from "./member-columns";
import { useMemberColumns } from "./useMemberColumns";

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned" }) }));
vi.mock("@/hooks/store/user", () => ({
  useUser: () => ({ data: { id: "owned" } }),
  useUserPermissions: () => ({ allowPermissions: () => true, getProjectRoleByWorkspaceSlugAndProjectId: () => 20 }),
}));
vi.mock("@/hooks/store/use-member", () => ({
  useMember: () => ({
    workspace: { filtersStore: { filters: {}, updateFilters: mocks.update } },
    project: { filters: { getFilters: () => ({}), updateFilters: mocks.update } },
  }),
}));
vi.mock("@/components/project/member-header-column", () => ({ MemberHeaderColumn: () => null }));
vi.mock("./member-columns", () => ({ NameColumn: () => null, AccountTypeColumn: () => null }));
vi.mock("@/components/project/settings/member-columns", () => ({
  NameColumn: () => null,
  AccountTypeColumn: () => null,
}));

const row: WorkspaceRow & ProjectRow = {
  member: {
    id: "owned",
    member: { id: "owned", avatar_url: "", display_name: "Owned", first_name: "Owned", last_name: "", is_bot: false },
    role: EUserWorkspaceRoles.ADMIN,
    joining_date: "2025-03-20",
  },
  is_active: true,
  role: EUserPermissions.ADMIN,
  original_role: EUserProjectRoles.ADMIN,
};
function WorkspaceDate() {
  const { columns } = useMemberColumns();
  return columns.at(-1)?.tdRender(row);
}
function ProjectDate() {
  const { columns } = useProjectColumns({ workspaceSlug: "owned", projectId: "owned" });
  return columns.at(-1)?.tdRender(row);
}

it.each(["workspace", "project"])(
  "updates the mounted %s joining date with language without editing membership",
  async (scope) => {
    const Component = scope === "workspace" ? WorkspaceDate : ProjectDate;
    await initPromise;
    await setLanguage("en");
    mocks.update.mockClear();
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Component))));
      expect(container.textContent).toBe("Mar 20, 2025");
      await act(async () => setLanguage("fa"));
      expect(container.textContent).toBe("اسف ۳۰, ۱۴۰۳");
      row.member.joining_date = "2025-03-20T22:00:00Z";
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Component))));
      expect(container.textContent).toBe("اسف ۳۰, ۱۴۰۳");
      await act(async () => setLanguage("en"));
      expect(container.textContent).toBe("Mar 20, 2025");
      expect(row.member.joining_date).toBe("2025-03-20T22:00:00Z");
      expect(mocks.update).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      row.member.joining_date = "2025-03-20";
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);
