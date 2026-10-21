/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CalendarOutline } from "@makeplane/propel/icons";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { ActivityPropertyChange } from "@/components/common/activity/property-change";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// helpers

type TIssueTargetDateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTargetDateActivity = observer(function IssueTargetDateActivity(props: TIssueTargetDateActivity) {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<CalendarOutline width={14} height={14} className="text-secondary" aria-hidden="true" />}
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
