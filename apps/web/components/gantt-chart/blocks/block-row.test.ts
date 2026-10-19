// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { IGanttBlock } from "@plane/types";
import { BlockRow } from "./block-row";

const mocks = vi.hoisted(() => ({ block: undefined as IGanttBlock | undefined }));
vi.mock("@/hooks/use-timeline-chart", () => ({
  useTimeLineChartStore: () => ({
    getBlockById: () => mocks.block,
    updateActiveBlockId: () => {},
    isBlockActive: () => false,
  }),
}));
vi.mock("@/hooks/store/use-issue-detail", () => ({ useIssueDetail: () => ({ getIsIssuePeeked: () => false }) }));
vi.mock("../helpers", () => ({ ChartAddBlock: () => null }));

it("keeps jump controls aligned with the actual sidebar when a mounted chart resizes", async () => {
  let sidebarWidth = 360;
  let resize: (() => void) | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly callback: IntersectionObserverCallback;
      readonly visibleLeft: number;
      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        this.callback = callback;
        this.visibleLeft = -Number.parseFloat(options.rootMargin!.split(" ")[3]);
      }
      observe(target: Element) {
        this.callback(
          [
            {
              target,
              isIntersecting: 260 > this.visibleLeft,
              boundingClientRect: { right: 260 },
              rootBounds: { left: this.visibleLeft },
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver
        );
      }
      disconnect = disconnect;
      unobserve = () => {};
    }
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this as unknown as ResizeObserver);
      }
      observe = () => {};
      disconnect = disconnect;
    }
  );
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  container.id = "gantt-container";
  container.innerHTML = '<div id="gantt-sidebar"></div><div id="gantt-block-owned"></div><div id="row"></div>';
  container.querySelector<HTMLElement>("#gantt-sidebar")!.getBoundingClientRect = () =>
    ({ width: sidebarWidth }) as DOMRect;
  document.body.append(container);
  const root = createRoot(container.querySelector("#row")!);
  mocks.block = {
    id: "owned",
    name: "آزمون ABC-42",
    data: { id: "owned" },
    start_date: "2025-03-19",
    target_date: "2025-03-20",
    position: { marginLeft: 0, width: 40 },
  } as IGanttBlock;
  try {
    await act(async () =>
      root.render(
        createElement(BlockRow, {
          blockId: "owned",
          showAllBlocks: true,
          blockUpdateHandler: () => {},
          handleScrollToBlock: () => {},
          enableAddBlock: true,
          selectionHelpers: {
            getIsEntitySelected: () => false,
            getIsEntityActive: () => false,
          } as unknown as ComponentProps<typeof BlockRow>["selectionHelpers"],
          ganttContainerRef: { current: container },
        })
      )
    );
    expect(container.querySelector("button")).not.toBeNull();
    sidebarWidth = 156;
    await act(async () => resize?.());
    expect(container.querySelector("button")).toBeNull();
    sidebarWidth = 360;
    await act(async () => resize?.());
    expect(container.querySelector("button")).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    vi.unstubAllGlobals();
  }
  expect(disconnect).toHaveBeenCalled();
});
