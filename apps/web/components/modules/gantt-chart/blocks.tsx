/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { renderFormattedDate } from "@plane/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { MODULE_STATUS } from "@plane/constants";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// components
import { getBlockViewDetails } from "@/components/issues/issue-layouts/utils";
// constants
// hooks
import { useModule } from "@/hooks/store/use-module";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleGanttBlock = observer(function ModuleGanttBlock(props: Props) {
  const { moduleId } = props;
  const { t, currentLocale } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // hooks
  const { isMobile } = usePlatformOS();

  const { blockStyle } = getBlockViewDetails(
    moduleDetails,
    MODULE_STATUS.find((s) => s.value === moduleDetails?.status)?.color ?? ""
  );

  const message = [
    moduleDetails?.start_date &&
      `${t("start_date")}: ${renderFormattedDate(moduleDetails.start_date, currentLocale === "fa" ? "d MMMM yyyy" : undefined, currentLocale)}`,
    moduleDetails?.target_date &&
      `${t("target_date")}: ${renderFormattedDate(moduleDetails.target_date, currentLocale === "fa" ? "d MMMM yyyy" : undefined, currentLocale)}`,
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <Tooltip
      label={moduleDetails?.name ? `${moduleDetails.name}: ${message ?? ""}` : (message ?? "")}
      layout="stacked"
      align="start"
      disabled={isMobile}
    >
      <Link
        className="relative flex h-full w-full cursor-pointer items-center rounded-sm"
        style={blockStyle}
        href={`/${workspaceSlug?.toString()}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`}
        draggable={false}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-surface-1/50" />
        <div
          className="sticky w-auto truncate overflow-hidden px-2.5 py-1 text-13 text-primary"
          style={{ left: "var(--gantt-sidebar-width)" }}
        >
          <bdi>{moduleDetails?.name}</bdi>
        </div>
      </Link>
    </Tooltip>
  );
});

export const ModuleGanttSidebarBlock = observer(function ModuleGanttSidebarBlock(props: Props) {
  const { moduleId } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);

  return (
    <Link
      className="relative flex h-full w-full items-center gap-2"
      href={`/${workspaceSlug?.toString()}/projects/${moduleDetails?.project_id}/modules/${moduleDetails?.id}`}
      draggable={false}
    >
      <ModuleStatusIcon status={moduleDetails?.status ?? "backlog"} height="16px" width="16px" />
      <h6 className="flex-grow truncate text-13 font-medium">
        <bdi>{moduleDetails?.name}</bdi>
      </h6>
    </Link>
  );
});
