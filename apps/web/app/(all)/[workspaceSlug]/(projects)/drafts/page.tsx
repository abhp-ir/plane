/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceDraftIssuesRoot } from "@/components/issues/workspace-draft";
import type { Route } from "./+types/page";

function WorkspaceDraftPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const pageTitle = t("drafts");

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <WorkspaceDraftIssuesRoot workspaceSlug={workspaceSlug} />
      </div>
    </>
  );
}

export default WorkspaceDraftPage;
