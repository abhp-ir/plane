/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { WorkItemsOutline } from "@makeplane/propel/icons";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { WorkItemActivityChange } from "@/components/common/activity/work-item-change";
// local imports
import { IssueActivityBlockComponent } from "./";

type TIssueDefaultActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDefaultActivity = observer(function IssueDefaultActivity(props: TIssueDefaultActivity) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<WorkItemsOutline width={14} height={14} className="text-secondary" aria-hidden="true" />}
      ends={ends}
    >
      {(actor) => <WorkItemActivityChange activity={activity} actor={actor} />}
    </IssueActivityBlockComponent>
  );
});
