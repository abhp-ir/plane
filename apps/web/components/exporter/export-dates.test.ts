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
import type { IExportData } from "@plane/types";
import { useExportColumns } from "./column";
import { SingleExport } from "./single-export";

const service = {
  id: "export",
  created_at: "2025-03-20T22:00:00Z",
  updated_at: "2025-03-20T22:00:00Z",
  project: ["project"],
  provider: "csv",
  status: "completed",
  url: "http://127.0.0.1:19000/retained.csv",
  token: "fixture",
  created_by: "user",
  updated_by: "user",
  initiated_by_detail: {
    id: "user",
    display_name: "نگار ABC-42",
    first_name: "نگار",
    last_name: "",
    avatar_url: "",
    is_bot: false,
  },
} satisfies IExportData;

function ExportTable() {
  return createElement(
    "table",
    null,
    createElement(
      "tbody",
      null,
      createElement(
        "tr",
        null,
        ...useExportColumns().map((column) => createElement("td", { key: column.key }, column.tdRender(service)))
      )
    )
  );
}

it.each(["table", "legacy-card"])(
  "updates the mounted %s date without changing export metadata, URL or seven-day expiry",
  async (surface) => {
    await initPromise;
    await setLanguage("en");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 2, 26, 23, 59, 59));
    const before = JSON.stringify(service);
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const render = () =>
      act(async () =>
        root.render(
          createElement(
            TranslationProvider,
            null,
            surface === "table"
              ? createElement(ExportTable)
              : createElement(SingleExport, { service, refreshing: false })
          )
        )
      );
    try {
      await render();
      expect(container.textContent).toContain("Mar 20, 2025");
      const href = container.querySelector("a")?.getAttribute("href");
      expect(href).toBe(service.url);
      await act(async () => setLanguage("fa"));
      expect(container.textContent).toContain("اسف ۳۰, ۱۴۰۳");
      expect(container.textContent).not.toContain("Mar 20, 2025");
      expect(container.querySelector("a")?.getAttribute("href")).toBe(href);
      expect(container.textContent).toContain(service.initiated_by_detail.display_name);
      expect(container.textContent).toContain("CSV");
      await act(async () => setLanguage("en"));
      expect(container.textContent).toContain("Mar 20, 2025");
      vi.setSystemTime(new Date(2025, 2, 27, 0, 0, 0));
      await render();
      expect(container.textContent).toContain("Expired");
      expect(container.querySelector("a")).toBeNull();
      expect(JSON.stringify(service)).toBe(before);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      vi.useRealTimers();
      await setLanguage("en");
    }
  }
);
