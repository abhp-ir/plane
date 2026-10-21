/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { TPowerKContext } from "../../core/types";
import { PowerKModalSearchMenu } from "./search-menu";

const route = vi.hoisted(() => ({ workspaceSlug: "workspace", projectId: undefined as string | undefined }));
vi.mock("next/navigation", () => ({ useParams: () => route }));
vi.mock("@plane/i18n", () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => `${key} ${options?.query ?? ""}` }),
}));
vi.mock("@/hooks/store/use-power-k", () => ({ usePowerK: () => ({ togglePowerKModal: vi.fn() }) }));
vi.mock("./no-results-command", () => ({ PowerKModalNoSearchResultsCommand: () => null }));
vi.mock("./search-results", () => ({ PowerKModalSearchResults: () => null }));

it.each([
  [undefined, false, "workspace"],
  [undefined, true, "workspace"],
  ["project", false, "project"],
  ["project", true, "workspace"],
] as const)(
  "describes actual query scope with project %s and workspace flag %s",
  (projectId, isWorkspaceLevel, scope) => {
    route.projectId = projectId;
    const html = renderToStaticMarkup(
      createElement(PowerKModalSearchMenu, {
        activePage: null,
        context: {} as TPowerKContext,
        isWorkspaceLevel,
        searchTerm: "می‌رود ABC-42",
        updateSearchTerm: vi.fn(),
      })
    );
    expect(html).toContain(`power_k.search_menu.results_in_${scope}`);
    expect(html).toContain("\u2068می‌رود ABC-42\u2069");
  }
);
