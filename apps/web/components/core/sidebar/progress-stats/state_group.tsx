/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { GROUP_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane imports
import { StateGroupIcon } from "@plane/blocks/icons";
import type { TStateGroups } from "@plane/types";
// components
import { SingleProgressStats } from "@/components/core/sidebar/single-progress-stats";

export type TStateGroupData = {
  state: string | undefined;
  completed: number;
  total: number;
}[];

type TStateGroupStatComponent = {
  selectedStateGroups: string[];
  handleStateGroupFiltersUpdate: (stateGroup: string | undefined) => void;
  distribution: TStateGroupData;
  totalIssuesCount: number;
  isEditable?: boolean;
};

export const StateGroupStatComponent = observer(function StateGroupStatComponent(props: TStateGroupStatComponent) {
  const { distribution, isEditable, totalIssuesCount, selectedStateGroups, handleStateGroupFiltersUpdate } = props;
  const { t } = useTranslation();

  return (
    <div>
      {distribution.map((group) => (
        <SingleProgressStats
          key={group.state ?? "none"}
          title={
            <div className="flex items-center gap-2">
              <StateGroupIcon stateGroup={group.state as TStateGroups} />
              <span className="text-11 capitalize">
                {GROUP_CHOICES[group.state as TStateGroups]?.i18n_label
                  ? t(GROUP_CHOICES[group.state as TStateGroups].i18n_label)
                  : (group.state ?? t("none"))}
              </span>
            </div>
          }
          completed={group.completed}
          total={totalIssuesCount}
          {...(isEditable && {
            onClick: () => group.state && handleStateGroupFiltersUpdate(group.state),
            selected: group.state ? selectedStateGroups.includes(group.state) : false,
          })}
        />
      ))}
    </div>
  );
});
