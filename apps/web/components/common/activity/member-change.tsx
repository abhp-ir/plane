/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement } from "react";
import { useParams } from "next/navigation";
import { ActivitySentence } from "./sentence";

type Props = {
  actor: ReactElement;
  issue?: ReactElement;
  activity: {
    workspace_detail?: { slug: string };
    old_value?: string | null;
    new_value?: string | null;
    old_identifier?: string | null;
    new_identifier?: string | null;
  };
};

export function ActivityMemberChange({ actor, activity, issue }: Props) {
  const { workspaceSlug } = useParams();
  const added = activity.old_value === "";
  const identifier = added ? activity.new_identifier : activity.old_identifier;
  const name = added ? activity.new_value : activity.old_value;
  return (
    <ActivitySentence
      actor={actor}
      issue={issue}
      message={added ? "assignee_added" : "assignee_removed"}
      value={
        <a
          href={`/${workspaceSlug ?? activity.workspace_detail?.slug}/profile/${identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          <bdi>{name}</bdi>
        </a>
      }
    />
  );
}
