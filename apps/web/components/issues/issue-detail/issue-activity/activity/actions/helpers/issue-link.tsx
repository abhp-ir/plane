/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Tooltip } from "@makeplane/propel/components/tooltip";
import { generateWorkItemLink } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueLink = {
  activityId: string;
};

export function IssueLink(props: TIssueLink) {
  const { activityId } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: activity.workspace_detail?.slug,
    projectId: activity.project,
    issueId: activity.issue,
    projectIdentifier: activity.project_detail.identifier,
    sequenceId: activity.issue_detail?.sequence_id,
  });
  return (
    <Tooltip
      label={activity.issue_detail ? activity.issue_detail.name : t("issue.empty_state.issue_detail.description")}
      layout="stacked"
      disabled={isMobile}
    >
      <a
        aria-disabled={activity.issue === null}
        href={`${activity.issue_detail ? workItemLink : "#"}`}
        target={activity.issue === null ? "_self" : "_blank"}
        rel={activity.issue === null ? "" : "noopener noreferrer"}
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        {activity.issue_detail ? (
          <bdi dir="ltr">{`${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}`}</bdi>
        ) : (
          t("issue.label", { count: 1 })
        )}{" "}
        <bdi className="font-regular">{activity.issue_detail?.name}</bdi>
      </a>
    </Tooltip>
  );
}
