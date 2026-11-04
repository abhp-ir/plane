/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { UserMenuRoot } from "./user-menu-root";

const { user } = vi.hoisted(() => ({
  user: { display_name: "محمدامین اسکندری", first_name: "Given", last_name: "Family", email: "test@example.test" },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/store/user", () => ({ useUser: () => ({ data: user, signOut: vi.fn() }) }));
vi.mock("@/hooks/store/use-app-theme", () => ({ useAppTheme: () => ({ toggleAnySidebarDropdown: vi.fn() }) }));
vi.mock("@/hooks/store/use-command-palette", () => ({
  useCommandPalette: () => ({ toggleProfileSettingsModal: vi.fn() }),
}));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/components/common/cover-image", () => ({ CoverImage: () => null }));
vi.mock("@makeplane/propel/components/menu", () => ({
  Menu: ({ children }: { children: ReactNode }) => children,
  MenuTrigger: () => null,
  MenuContent: ({ children }: { children: ReactNode }) => children,
  MenuItem: () => null,
}));

it("shows the unmodified display name in either script and keeps the full-name fallback", () => {
  for (const name of ["محمدامین", "محمدامین اسکندری", "علی‌رضا", "علی Reza-123", "john.doe-123"]) {
    user.display_name = name;
    const markup = renderToStaticMarkup(createElement(UserMenuRoot));
    expect(markup).toContain(`dir="auto">${name}</p>`);
    expect(markup).not.toContain("Given Family");
  }
  user.display_name = "";
  expect(renderToStaticMarkup(createElement(UserMenuRoot))).toContain('dir="auto">Given Family</p>');
});
