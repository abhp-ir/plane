/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getCalendarPreferences, getOrderedDays, getWeekdayLabel } from "@plane/utils";
import { Select } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import { SettingsControlItem } from "@/components/settings/control-item";
import { useUserProfile } from "@/hooks/store/user";

export const WorkingDaysPreference = observer(function WorkingDaysPreference() {
  const { data, updateUserProfile } = useUserProfile();
  const { t, currentLocale } = useTranslation();
  const [saving, setSaving] = useState(false);
  const { startOfWeek, workingDays } = getCalendarPreferences(data, currentLocale);
  const options = getOrderedDays(START_OF_THE_WEEK_OPTIONS, (day) => day.value, startOfWeek).map(({ value }) => ({
    value,
    label: getWeekdayLabel(value, currentLocale),
  }));
  const selected = options.filter((option) => workingDays.includes(option.value));
  const label = new Intl.ListFormat(currentLocale === "ua" ? "uk-UA" : currentLocale, {
    style: "short",
    type: "conjunction",
  }).format(selected.map((option) => option.label));
  const title = t("account_settings.preferences.working_days.title");

  const save = async (values: string[]) => {
    if (!values.length) return;
    setSaving(true);
    try {
      await updateUserProfile({ working_days: values.map(Number) });
    } catch (_error) {
      setToast({ type: "error", title: t("toast.error"), message: t("entity.update.failed", { entity: title }) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsControlItem
      title={title}
      description={t("account_settings.preferences.working_days.description")}
      control={
        <Select
          multiple
          getValues={() => options}
          value={selected}
          onChange={(values) => void save(values)}
          getOptionValue={(option) => String(option.value)}
          getOptionLabel={(option) => option.label}
          getOptionDisabled={(option) => selected.length === 1 && workingDays.includes(option.value)}
          disabled={saving}
          placeholder={title}
          showSearch={false}
          pinSelected={false}
          contentSizing="anchor"
        >
          <Select.Trigger variant="select-md" className="w-42 max-w-full">
            <span className="min-w-0 grow truncate text-start" title={label}>
              {label}
            </span>
          </Select.Trigger>
        </Select>
      }
    />
  );
});
