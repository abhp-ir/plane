/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
// plane imports
// components
import type { ChartDataType, IBlockUpdateData, IBlockUpdateDependencyData, TGanttViews } from "@plane/types";
import { cn, getCalendarPreferences } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { GanttChartHeader, GanttChartMainContent } from "@/components/gantt-chart";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { getGanttSidebarWidth } from "../constants";
import { currentViewDataWithView } from "../data";
import type { IMonthBlock, IMonthView, IWeekBlock } from "../views";
import { getNumberOfDaysBetweenTwoDates, monthView, quarterView, weekView } from "../views";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableReorder: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  enableDependency: boolean | ((blockId: string) => boolean);
  bottomSpacing: boolean;
  showAllBlocks: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  canLoadMoreBlocks?: boolean;
  quickAdd?: React.ReactNode | undefined;
  showToday: boolean;
  isEpic?: boolean;
};

const timelineViewHelpers = {
  week: weekView,
  month: monthView,
  quarter: quarterView,
};

const updateCurrentLeftScrollPosition = (width: number) => {
  const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
  if (!scrollContainer) return;

  scrollContainer.scrollLeft = width + scrollContainer?.scrollLeft;
};

export const ChartViewRoot = observer(function ChartViewRoot(props: ChartViewRootProps) {
  const {
    border,
    title,
    blockIds,
    loadMoreBlocks,
    loaderTitle,
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    canLoadMoreBlocks,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableReorder,
    enableAddBlock,
    enableSelection,
    enableDependency,
    bottomSpacing,
    showAllBlocks,
    quickAdd,
    showToday,
    updateBlockDates,
    isEpic = false,
  } = props;
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // hooks
  const {
    currentView,
    currentViewData,
    renderView,
    updateCurrentView,
    updateCurrentViewData,
    updateRenderView,
    updateAllBlocksOnChartChangeWhileDragging,
  } = useTimeLineChartStore();
  const { data } = useUserProfile();
  const { currentLocale } = useTranslation();
  const { startOfWeek } = getCalendarPreferences(data, currentLocale);

  const updateCurrentViewRenderPayload = (side: null | "left" | "right", view: TGanttViews, targetDate?: Date) => {
    const selectedCurrentView: TGanttViews = view;
    const selectedCurrentViewData: ChartDataType | undefined =
      selectedCurrentView && selectedCurrentView === currentViewData?.key
        ? currentViewData
        : currentViewDataWithView(view);

    if (selectedCurrentViewData === undefined) return;

    const currentViewHelpers = timelineViewHelpers[selectedCurrentView];
    const anchor =
      side === null && targetDate
        ? { ...selectedCurrentViewData, data: { ...selectedCurrentViewData.data, currentDate: targetDate } }
        : selectedCurrentViewData;
    const currentRender = currentViewHelpers.generateChart(anchor, side, targetDate, startOfWeek, currentLocale);
    const mergeRenderPayloads = currentViewHelpers.mergeRenderPayloads as (
      a: IWeekBlock[] | IMonthView | IMonthBlock[],
      b: IWeekBlock[] | IMonthView | IMonthBlock[]
    ) => IWeekBlock[] | IMonthView | IMonthBlock[];

    // updating the prevData, currentData and nextData
    if (currentRender.payload) {
      updateCurrentViewData(currentRender.state);

      if (side === "left") {
        updateCurrentView(selectedCurrentView);
        updateRenderView(mergeRenderPayloads(currentRender.payload, renderView));
        if (!targetDate) updateCurrentLeftScrollPosition(currentRender.scrollWidth);
        updateAllBlocksOnChartChangeWhileDragging(currentRender.scrollWidth);
        setItemsContainerWidth((width) => width + currentRender.scrollWidth);
      } else if (side === "right") {
        updateCurrentView(view);
        updateRenderView(mergeRenderPayloads(renderView, currentRender.payload));
        setItemsContainerWidth((width) => width + currentRender.scrollWidth);
      } else {
        updateCurrentView(view);
        updateRenderView(currentRender.payload);
        setItemsContainerWidth(currentRender.scrollWidth);
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          handleScrollToCurrentSelectedDate(currentRender.state, currentRender.state.data.currentDate);
        }, 50);
      }
    }

    return currentRender.state;
  };

  const handleToday = () => updateCurrentViewRenderPayload(null, currentView, new Date());

  // handling the scroll positioning from left and right
  useEffect(() => {
    updateCurrentViewRenderPayload(null, currentView);
    return () => clearTimeout(scrollTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocale, startOfWeek]);

  const handleScrollToCurrentSelectedDate = (currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    const clientVisibleWidth: number = scrollContainer?.clientWidth;
    let scrollWidth: number = 0;
    let daysDifference: number = 0;
    daysDifference = getNumberOfDaysBetweenTwoDates(currentState.data.startDate, date);

    scrollWidth =
      Math.abs(daysDifference) * currentState.data.dayWidth -
      (clientVisibleWidth / 2 - currentState.data.dayWidth) +
      getGanttSidebarWidth(scrollContainer) / 2;

    scrollContainer.scrollLeft = scrollWidth;
  };

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div
      style={{ "--gantt-sidebar-width": "clamp(144px, 40vw, 360px)" } as CSSProperties}
      className={cn("shadow relative flex h-full flex-col rounded-xs bg-surface-1 select-none", {
        "inset-0 z-[25] bg-surface-1": fullScreenMode,
        "border-[0.5px] border-subtle": border,
      })}
    >
      <GanttChartHeader
        blockIds={blockIds}
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleChartView={(key) => updateCurrentViewRenderPayload(null, key)}
        handleToday={handleToday}
        loaderTitle={loaderTitle}
        showToday={showToday}
      />
      <GanttChartMainContent
        blockIds={blockIds}
        loadMoreBlocks={loadMoreBlocks}
        canLoadMoreBlocks={canLoadMoreBlocks}
        blockToRender={blockToRender}
        blockUpdateHandler={blockUpdateHandler}
        bottomSpacing={bottomSpacing}
        enableBlockLeftResize={enableBlockLeftResize}
        enableBlockMove={enableBlockMove}
        enableBlockRightResize={enableBlockRightResize}
        enableReorder={enableReorder}
        enableSelection={enableSelection}
        enableAddBlock={enableAddBlock}
        enableDependency={enableDependency}
        itemsContainerWidth={itemsContainerWidth}
        showAllBlocks={showAllBlocks}
        sidebarToRender={sidebarToRender}
        title={title}
        updateCurrentViewRenderPayload={updateCurrentViewRenderPayload}
        quickAdd={quickAdd}
        updateBlockDates={updateBlockDates}
        isEpic={isEpic}
      />
    </div>
  );

  return fullScreenMode && portalContainer ? createPortal(content, portalContainer) : content;
});
