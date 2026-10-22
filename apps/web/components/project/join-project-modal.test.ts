// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IProject } from "@plane/types";
import { JoinProjectModal } from "./join-project-modal";

const mocks = vi.hoisted(() => ({ join: vi.fn(), push: vi.fn(), close: vi.fn() }));
vi.mock("@/hooks/store/user", () => ({ useUserPermissions: () => ({ joinProject: mocks.join }) }));
vi.mock("@/hooks/use-app-router", () => ({ useAppRouter: () => ({ push: mocks.push }) }));

it("localizes the actual join dialog and preserves its name, cancellation, loading and destination", async () => {
  await initPromise;
  const project: IProject = {
    id: "project",
    name: "Project ABC-42 <script> می‌رود",
    identifier: "FA",
    description: "",
    created_at: new Date(2025, 2, 20, 12),
    member_role: null,
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
  const before = structuredClone(project);
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let complete!: () => void;
  mocks.join.mockReturnValue(
    new Promise<void>((resolve) => {
      complete = resolve;
    })
  );
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(JoinProjectModal, { project, workspaceSlug: "owned", isOpen: true, handleClose: mocks.close })
        )
      )
    );
    const checkLanguage = async (language: "fa" | "en") => {
      await act(async () => setLanguage(language));
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
      expect(dialog).not.toBeNull();
      expect(dialog.querySelector("bdi")?.textContent).toBe(project.name);
      expect(dialog.querySelector("script")).toBeNull();
      expect(dialog.querySelector("p")?.textContent).toBe(
        language === "fa"
          ? `آیا می‌خواهید به پروژهٔ ${project.name} بپیوندید؟`
          : `Are you sure you want to join the project ${project.name}?`
      );
      expect(dialog.textContent).toContain(language === "fa" ? "پیوستن به پروژه" : "Join project");
    };
    await checkLanguage("fa");
    await checkLanguage("en");
    await checkLanguage("fa");
    const cancel = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      (button) => button.textContent === "انصراف"
    )!;
    await act(async () => cancel.click());
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.join).not.toHaveBeenCalled();
    const join = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')).find(
      (button) => button.textContent === "پیوستن به پروژه"
    )!;
    await act(async () => join.click());
    expect(mocks.join).toHaveBeenCalledWith("owned", "project");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("در حال پیوستن به پروژه");
    await act(async () => complete());
    expect(mocks.push).toHaveBeenCalledWith("/owned/projects/project/issues");
    expect(mocks.close).toHaveBeenCalledTimes(2);
    expect(project).toEqual(before);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
