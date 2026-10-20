// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { DialogTitle } from "@makeplane/propel/components/dialog";
import { initPromise, TranslationProvider } from "@plane/i18n";
import { EIssuesStoreType } from "@plane/types";
import { CreateUpdateIssueModalBase } from "./base";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), rowClick: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ workspaceSlug: "owned", projectId: "project" }) }));
vi.mock("@/hooks/context/use-issue-modal", () => ({ useIssueModal: () => ({ allowedProjectIds: ["project"] }) }));
vi.mock("@/hooks/store/use-cycle", () => ({ useCycle: () => ({}) }));
vi.mock("@/hooks/store/use-module", () => ({ useModule: () => ({}) }));
vi.mock("@/hooks/store/use-issue-detail", () => ({ useIssueDetail: () => ({}) }));
vi.mock("@/hooks/store/use-issues", () => ({ useIssues: () => ({ issues: {} }) }));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({ getProjectByIdentifier: () => undefined }) }));
vi.mock("@/hooks/use-issue-layout-store", () => ({ useIssueStoreType: () => EIssuesStoreType.PROJECT }));
vi.mock("@/hooks/use-issues-actions", () => ({ useIssuesActions: () => ({}) }));
vi.mock("@/services/file.service", () => ({ FileService: vi.fn() }));
vi.mock("../create-issue-toast-action-items", () => ({ useCreateIssueToastActions: () => vi.fn() }));
vi.mock("./draft-issue-layout", () => ({ DraftIssueLayout: () => null }));
vi.mock("./form", () => ({
  IssueFormRoot: () =>
    createElement(
      "form",
      {
        onSubmit: (event: React.FormEvent) => {
          event.preventDefault();
          mocks.submit();
        },
      },
      createElement(DialogTitle, null, "Edit owned work item"),
      createElement("button", { type: "submit" }, "Update")
    ),
}));

it("keeps a portal form's native submit away from the list row's cancelling click handler", async () => {
  await initPromise;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(
            "div",
            {
              onClick: (event: React.MouseEvent) => {
                event.preventDefault();
                mocks.rowClick();
              },
            },
            createElement(CreateUpdateIssueModalBase, {
              isOpen: true,
              onClose: vi.fn(),
              data: { id: "issue", project_id: "project", description_html: "<p>می‌رود ABC-42</p>" },
              fetchIssueDetails: false,
              withDraftIssueWrapper: false,
            })
          )
        )
      )
    );
    const button = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button).not.toBeNull();
    expect(container.contains(button)).toBe(false);
    await act(async () => button.click());
    expect(mocks.submit).toHaveBeenCalledOnce();
    expect(mocks.rowClick).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
