/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import type { Route } from "./+types/layout";

export default function CreateWorkspaceLayout() {
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t("create_workspace")} />
      <Outlet />
    </>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Create Workspace" }];
