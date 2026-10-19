/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import React from "react";
import { observer } from "mobx-react";
// hooks
import type { IGanttBlock } from "@plane/types";
// helpers
import { cn, getDate } from "@plane/utils";
// components
import { LeftResizable } from "./blockResizables/left-resizable";
import { RightResizable } from "./blockResizables/right-resizable";

type Props = {
  block: IGanttBlock;
  blockToRender: (data: any) => React.ReactNode;
  handleBlockDrag: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dragDirection: "left" | "right" | "move") => void;
  handleBlockKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, direction: "left" | "right") => void;
  isMoving: "left" | "right" | "move" | undefined;
  enableBlockLeftResize: boolean;
  enableBlockRightResize: boolean;
  enableBlockMove: boolean;
  enableDependency: boolean | ((blockId: string) => boolean);
  ganttContainerRef: RefObject<HTMLDivElement | null>;
};

export const ChartDraggable = observer(function ChartDraggable(props: Props) {
  const {
    block,
    blockToRender,
    handleBlockDrag,
    handleBlockKeyDown,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    isMoving,
  } = props;

  return (
    <div className="group relative z-[5] inline-flex h-full w-full cursor-pointer items-center font-medium transition-all">
      <LeftResizable
        enableBlockLeftResize={enableBlockLeftResize}
        maxDate={getDate(block.target_date)}
        handleBlockDrag={handleBlockDrag}
        handleBlockKeyDown={handleBlockKeyDown}
        isMoving={isMoving}
        position={block.position}
      />
      {/* oxlint-disable-next-line jsx_a11y/no-static-element-interactions */}
      <div
        className={cn("relative z-[6] flex h-8 w-full items-center rounded-sm", {
          "pointer-events-none": isMoving,
        })}
        onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}
      >
        {blockToRender({ ...block.data, meta: block.meta })}
      </div>
      {/* right resize drag handle */}
      <RightResizable
        enableBlockRightResize={enableBlockRightResize}
        minDate={getDate(block.start_date)}
        handleBlockDrag={handleBlockDrag}
        handleBlockKeyDown={handleBlockKeyDown}
        isMoving={isMoving}
        position={block.position}
      />
    </div>
  );
});
