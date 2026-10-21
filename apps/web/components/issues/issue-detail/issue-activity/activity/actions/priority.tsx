/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PriorityOutline } from "@makeplane/propel/icons";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { ActivityPropertyChange } from "@/components/common/activity/property-change";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssuePriorityActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssuePriorityActivity = observer(function IssuePriorityActivity(props: TIssuePriorityActivity) {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<PriorityOutline className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      {(actor) => (
        <ActivityPropertyChange
          activity={activity}
          actor={actor}
          issue={showIssue ? <IssueLink activityId={activityId} /> : undefined}
        />
      )}
    </IssueActivityBlockComponent>
  );
});
