/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getWeekdayLabel } from "@plane/utils";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type TStartOfWeekOption = (typeof START_OF_THE_WEEK_OPTIONS)[number];

// The dropdown opens flush with the control's right edge, as `placement="bottom-end"` did.
const DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

export const StartOfWeekPreference = observer(function StartOfWeekPreference(props: {
  option: { title: string; description: string };
}) {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();
  const { t, currentLocale } = useTranslation();

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({
        type: "success",
        title: t("toast.success"),
        message: t("entity.update.success", { entity: t("account_settings.preferences.start_of_week.title") }),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("entity.update.failed", { entity: t("account_settings.preferences.start_of_week.title") }),
      });
    }
  };

  // derived values
  const weekdayOptions = START_OF_THE_WEEK_OPTIONS.map(({ value }) => ({
    value,
    label: getWeekdayLabel(value, currentLocale),
  }));
  const selectedOption = weekdayOptions.find((option) => option.value === userProfile.start_of_the_week) ?? null;

  return (
    <SettingsControlItem
      title={props.option.title}
      description={props.option.description}
      control={
        <SelectDropdownPlacementContext.Provider value={DROPDOWN_PLACEMENT}>
          <Select<TStartOfWeekOption>
            getValues={() => weekdayOptions}
            value={selectedOption}
            onChange={(val) => void handleStartOfWeekChange(Number(val))}
            getOptionValue={(option) => String(option.value)}
            getOptionLabel={(option) => option.label}
            placeholder={props.option.title}
            showSearch={false}
            pinSelected={false}
            contentSizing="anchor"
          >
            <Select.Trigger<TStartOfWeekOption> variant="select-md" className="w-42 max-w-full border-subtle-1">
              {(options) => <span className="min-w-0 grow truncate text-start">{options[0]?.label}</span>}
            </Select.Trigger>
          </Select>
        </SelectDropdownPlacementContext.Provider>
      }
    />
  );
});
