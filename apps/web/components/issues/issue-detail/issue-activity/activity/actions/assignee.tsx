/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// icons
import { MembersOutline } from "@makeplane/propel/icons";
// hooks;
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { ActivityMemberChange } from "@/components/common/activity/member-change";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueAssigneeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueAssigneeActivity = observer(function IssueAssigneeActivity(props: TIssueAssigneeActivity) {
  const { activityId, ends, showIssue = true } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<MembersOutline className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      {(actor) => (
        <ActivityMemberChange
          activity={activity}
          actor={actor}
          issue={showIssue ? <IssueLink activityId={activityId} /> : undefined}
        />
      )}
    </IssueActivityBlockComponent>
  );
});
