/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { addDays, startOfDay } from "date-fns";
import { observer } from "mobx-react";

// components
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import type { TSupportedFilterForUpdate } from "@plane/types";
import { Row } from "@plane/blocks/layout";
import { getCalendarDateLib } from "@plane/utils";
// icons
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
import { CalendarMonthsDropdown, CalendarOptionsDropdown } from "./dropdowns";

interface ICalendarHeader {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  updateFilters?: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
  setSelectedDate: (date: Date) => void;
}

export const CalendarHeader = observer(function CalendarHeader(props: ICalendarHeader) {
  const { issuesFilterStore, updateFilters, setSelectedDate } = props;

  const { t, currentLocale } = useTranslation();
  const calendar = getCalendarDateLib(currentLocale);

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const { activeMonthDate, activeWeekDate } = issueCalendarView.calendarFilters;

  const handleNavigate = (offset: number) => {
    if (calendarLayout === "month") {
      issueCalendarView.updateCalendarFilters({
        activeMonthDate: calendar.addMonths(calendar.startOfMonth(activeMonthDate), offset),
      });
    } else {
      issueCalendarView.updateCalendarFilters({
        activeWeekDate: startOfDay(addDays(activeWeekDate, offset * 7)),
      });
    }
  };

  const handleToday = () => {
    const today = new Date();
    const firstDayOfCurrentMonth = calendar.startOfMonth(today);

    issueCalendarView.updateCalendarFilters({
      activeMonthDate: firstDayOfCurrentMonth,
      activeWeekDate: today,
    });
    setSelectedDate(today);
  };

  return (
    <Row className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={t("prev")}
          className="grid size-6 place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-accent-strong"
          onClick={() => handleNavigate(-1)}
        >
          <ChevronLeftOutline height={16} width={16} className="rtl:rotate-180" />
        </button>
        <button
          type="button"
          aria-label={t("common.next")}
          className="grid size-6 place-items-center rounded-sm focus-visible:outline-2 focus-visible:outline-accent-strong"
          onClick={() => handleNavigate(1)}
        >
          <ChevronRightOutline height={16} width={16} className="rtl:rotate-180" />
        </button>
        <CalendarMonthsDropdown issuesFilterStore={issuesFilterStore} />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="rounded-sm bg-layer-transparent px-2.5 py-1 text-11 font-medium text-secondary hover:bg-layer-transparent-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-accent-strong"
          onClick={handleToday}
        >
          {t("common.today")}
        </button>
        <CalendarOptionsDropdown issuesFilterStore={issuesFilterStore} updateFilters={updateFilters} />
      </div>
    </Row>
  );
});
