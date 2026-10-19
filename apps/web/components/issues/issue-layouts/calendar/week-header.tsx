/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { getCalendarPreferences, getOrderedDays, getWeekdayLabel } from "@plane/utils";
import { DAYS_LIST } from "@plane/constants";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  isLoading: boolean;
  showWeekends: boolean;
};

export const CalendarWeekHeader = observer(function CalendarWeekHeader(props: Props) {
  const { isLoading, showWeekends } = props;
  // hooks
  const { data } = useUserProfile();
  const { t, currentLocale } = useTranslation();
  const { startOfWeek, workingDays } = getCalendarPreferences(data, currentLocale);

  // derived
  const orderedDays = getOrderedDays(Object.values(DAYS_LIST), (item) => item.value, startOfWeek).filter(
    (day) => showWeekends || workingDays.includes(day.value)
  );

  return (
    <div
      className="relative sticky top-0 z-[1] grid divide-subtle-1 text-13 font-medium md:divide-x-[0.5px]"
      style={{ gridTemplateColumns: `repeat(${orderedDays.length}, minmax(0, 1fr))` }}
    >
      {isLoading && (
        <div className="absolute h-[1.5px] w-3/4 animate-[bar-loader_2s_linear_infinite] bg-accent-primary" />
      )}
      {orderedDays.map((day) => {
        return (
          <div key={day.value} className="flex h-11 items-center justify-center bg-layer-1 px-1 md:justify-end md:px-4">
            <abbr
              className="no-underline"
              title={`${getWeekdayLabel(day.value, currentLocale)} — ${t(workingDays.includes(day.value) ? "working_day" : "non_working_day")}`}
              aria-label={getWeekdayLabel(day.value, currentLocale)}
            >
              {getWeekdayLabel(day.value, currentLocale, "short")}
            </abbr>
          </div>
        );
      })}
    </div>
  );
});
