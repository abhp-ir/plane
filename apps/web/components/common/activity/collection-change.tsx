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
    field?: string | null;
    verb: string;
    project: string;
    workspace_detail?: { slug: string };
    old_identifier?: string | null;
    new_identifier?: string | null;
    old_value?: string | null;
    new_value?: string | null;
  };
};

export function ActivityCollectionChange({ activity, actor, issue }: Props) {
  const { workspaceSlug } = useParams();
  if (activity.field !== "cycles" && activity.field !== "modules") return null;
  const removed = activity.verb !== "created" && activity.verb !== "updated";
  const identifier = removed ? activity.old_identifier : activity.new_identifier;
  const name = removed ? activity.old_value : activity.new_value;

  return (
    <ActivitySentence
      actor={actor}
      issue={issue}
      kind={activity.field}
      message={removed ? "collection_removed" : "collection_assigned"}
      value={
        <a
          href={`/${workspaceSlug ?? activity.workspace_detail?.slug}/projects/${activity.project}/${activity.field}/${identifier}`}
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
