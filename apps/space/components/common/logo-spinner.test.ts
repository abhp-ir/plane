/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { LogoSpinner } from "./logo-spinner";

const theme = vi.hoisted(() => ({ resolvedTheme: undefined as string | undefined }));
vi.mock("next-themes", () => ({ useTheme: () => theme }));

it.each(["light", "dark"])("keeps the server loader markup when the client resolves %s", (resolvedTheme) => {
  theme.resolvedTheme = undefined;
  const server = renderToString(createElement(LogoSpinner));
  theme.resolvedTheme = resolvedTheme;
  expect(renderToString(createElement(LogoSpinner))).toBe(server);
});
