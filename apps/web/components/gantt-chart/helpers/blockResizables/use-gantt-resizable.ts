/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { useTranslation } from "@plane/i18n";
// Plane
import { setToast } from "@plane/blocks/toast";
import type { IBlockUpdateDependencyData, IGanttBlock } from "@plane/types";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { DEFAULT_BLOCK_WIDTH, getGanttSidebarWidth } from "../../constants";

export const useGanttResizable = (
  block: IGanttBlock,
  resizableRef: React.RefObject<HTMLDivElement | null>,
  ganttContainerRef: React.RefObject<HTMLDivElement | null>,
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>
) => {
  const { t } = useTranslation();
  // refs
  const initialPositionRef = useRef<{ marginLeft: number; width: number; offsetX: number }>({
    marginLeft: 0,
    width: 0,
    offsetX: 0,
  });
  const ganttContainerDimensions = useRef<DOMRect | undefined>(undefined);
  const currMouseEvent = useRef<MouseEvent | undefined>(undefined);
  // states
  const { currentViewData, updateBlockPosition, setIsDragging, getUpdatedPositionAfterDrag, isDragging } =
    useTimeLineChartStore();
  const [isMoving, setIsMoving] = useState<"left" | "right" | "move" | undefined>();

  const saveDates = async (direction: "left" | "right" | "move") => {
    // update half blocks only when the missing side of the block is directly dragged
    const shouldUpdateHalfBlock =
      (direction === "left" && !block.start_date) || (direction === "right" && !block.target_date);

    try {
      const blockUpdates = getUpdatedPositionAfterDrag(block.id, shouldUpdateHalfBlock);
      if (updateBlockDates) await updateBlockDates(blockUpdates);
    } catch {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("entity.update.failed", { entity: t("common.dates") }),
      });
    } finally {
      setIsMoving(undefined);
      setIsDragging(false);
    }
  };

  const handleBlockKeyDown = async (event: React.KeyboardEvent<HTMLDivElement>, direction: "left" | "right") => {
    if (!currentViewData || !block.position || isDragging || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = ["ArrowRight", "ArrowUp"].includes(event.key)
      ? 1
      : ["ArrowLeft", "ArrowDown"].includes(event.key)
        ? -1
        : 0;
    if (!step) return;
    event.preventDefault();
    const delta = step * currentViewData.data.dayWidth;
    const deltaLeft = direction === "left" || !block.start_date ? delta : 0;
    const deltaWidth = direction === "left" ? (block.target_date ? -delta : 0) : block.start_date ? delta : 0;
    if (block.position.width + deltaWidth < currentViewData.data.dayWidth) return;
    setIsDragging(true);
    setIsMoving(direction);
    updateBlockPosition(block.id, deltaLeft, deltaWidth);
    await saveDates(direction);
  };

  // handle block resize from the left end
  const handleBlockDrag = (
    dragEvent: React.MouseEvent<HTMLDivElement, MouseEvent>,
    dragDirection: "left" | "right" | "move"
  ) => {
    const ganttContainerElement = ganttContainerRef.current;
    if (isDragging || !currentViewData || !resizableRef.current || !block.position || !ganttContainerElement) return;

    if (dragEvent.button !== 0) return;

    const resizableDiv = resizableRef.current;

    ganttContainerDimensions.current = ganttContainerElement.getBoundingClientRect();

    const dayWidth = currentViewData.data.dayWidth;
    const sidebarWidth = getGanttSidebarWidth(ganttContainerElement);
    currMouseEvent.current = undefined;
    const initialMouseX =
      dragEvent.clientX - ganttContainerDimensions.current.left - sidebarWidth + ganttContainerElement.scrollLeft;

    // record position on drag start
    initialPositionRef.current = {
      width: block.position.width ?? 0,
      marginLeft: block.position.marginLeft ?? 0,
      offsetX: initialMouseX - block.position.marginLeft,
    };

    const handleOnScroll = () => {
      if (currMouseEvent.current) handleMouseMove(currMouseEvent.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      currMouseEvent.current = e;
      setIsMoving(dragDirection);
      setIsDragging(true);

      if (!ganttContainerDimensions.current) return;

      const { left: containerLeft } = ganttContainerDimensions.current;

      const mouseX = e.clientX - containerLeft - sidebarWidth + ganttContainerElement.scrollLeft;

      let width = initialPositionRef.current.width;
      let marginLeft = block.position?.marginLeft ?? initialPositionRef.current.marginLeft;
      const leftEdge = mouseX - initialPositionRef.current.offsetX;

      if (dragDirection === "left") {
        // calculate new marginLeft and update the initial marginLeft to the newly calculated one
        marginLeft = Math.round(leftEdge / dayWidth) * dayWidth;
        // get Dimensions from dom's style
        const prevMarginLeft = parseFloat(resizableDiv.style.marginLeft.slice(0, -2));
        const prevWidth = parseFloat(resizableDiv.style.width.slice(0, -2));
        // calculate new width
        const marginDelta = prevMarginLeft - marginLeft;
        // If target date does not exist while dragging with left handle the revert to default width
        width = block.target_date ? prevWidth + marginDelta : DEFAULT_BLOCK_WIDTH;
      } else if (dragDirection === "right") {
        // calculate new width and update the initialMarginLeft using +=
        const rightEdge = Math.round((leftEdge + initialPositionRef.current.width) / dayWidth) * dayWidth;
        width = rightEdge - marginLeft;

        // If start date does not exist while dragging with right handle the revert to default width and adjust marginLeft accordingly
        if (!block.start_date) {
          // calculate new right and update the marginLeft to the newly calculated one
          marginLeft = rightEdge - DEFAULT_BLOCK_WIDTH;
          width = DEFAULT_BLOCK_WIDTH;
        }
      } else if (dragDirection === "move") {
        // calculate new marginLeft and update the initial marginLeft using -=
        marginLeft = Math.round(leftEdge / dayWidth) * dayWidth;
      }

      // block needs to be at least 1 dayWidth Wide
      if (width < dayWidth) return;

      resizableDiv.style.width = `${width}px`;
      resizableDiv.style.marginLeft = `${marginLeft}px`;

      const deltaLeft = Math.round((marginLeft - (block.position?.marginLeft ?? 0)) / dayWidth) * dayWidth;
      const deltaWidth = Math.round((width - (block.position?.width ?? 0)) / dayWidth) * dayWidth;

      // call update blockPosition
      if (deltaWidth || deltaLeft) updateBlockPosition(block.id, deltaLeft, deltaWidth);
    };

    // remove event listeners and call updateBlockDates
    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      ganttContainerElement.removeEventListener("scroll", handleOnScroll);
      document.removeEventListener("mouseup", handleMouseUp);

      if (!currMouseEvent.current) return;

      await saveDates(dragDirection);
    };

    document.addEventListener("mousemove", handleMouseMove);
    ganttContainerElement.addEventListener("scroll", handleOnScroll);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return {
    isMoving,
    handleBlockDrag,
    handleBlockKeyDown,
  };
};
