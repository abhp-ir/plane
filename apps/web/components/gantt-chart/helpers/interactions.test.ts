// @vitest-environment jsdom
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";
import { observer } from "mobx-react";
import { expect, it, vi } from "vitest";
import { initPromise, setLanguage, TranslationProvider } from "@plane/i18n";
import type { IBlockUpdateDependencyData, IGanttBlock } from "@plane/types";
import type { RootStore } from "@/store/root.store";
import { BaseTimeLineStore } from "@/store/timeline/base-timeline.store";
import { ChartAddBlock } from "./add-block";
import { useGanttResizable } from "./blockResizables/use-gantt-resizable";

const mocks = vi.hoisted(() => ({ store: undefined as BaseTimeLineStore | undefined, toast: vi.fn() }));
vi.mock("@/hooks/use-timeline-chart", () => ({ useTimeLineChartStore: () => mocks.store }));
vi.mock("@/hooks/use-platform-os", () => ({ usePlatformOS: () => ({ isMobile: false }) }));
vi.mock("@plane/blocks/toast", () => ({ setToast: mocks.toast }));

const storeFor = () => {
  const store = new BaseTimeLineStore({} as RootStore);
  const current = new Date(2025, 2, 15);
  store.updateCurrentViewData({
    key: "week",
    i18n_title: "common.week",
    data: {
      startDate: current,
      currentDate: current,
      endDate: new Date(2025, 3, 1),
      dayWidth: 60,
      approxFilterRange: 3,
    },
  });
  mocks.store = store;
  return store;
};

it.each([
  ["left", 60, "mouse"],
  ["right", 60, "mouse"],
  ["move", 60, "mouse"],
  ["rejected", 60, "mouse"],
  ["left", 5, "mouse"],
  ["right", 5, "mouse"],
  ["left", 5, "keyboard"],
  ["right", 5, "keyboard"],
] as const)(
  "keeps canonical dates, actual sidebar width and asynchronous cleanup for %s at %d pixels/day with %s",
  async (direction, dayWidth, input) => {
    await initPromise;
    await setLanguage("fa");
    const store = storeFor();
    store.updateCurrentViewData({ ...store.currentViewData!, data: { ...store.currentViewData!.data, dayWidth } });
    const block = {
      id: "owned",
      data: {},
      name: "آزمون ABC-42",
      sort_order: 1,
      start_date: "2025-03-15",
      target_date: "2025-03-16",
      position: { marginLeft: 0, width: dayWidth * 2 },
    } as IGanttBlock;
    store.blocksMap.owned = block;
    let finish: (() => void) | undefined;
    const completion = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const update = vi.fn(async (_: IBlockUpdateDependencyData[]) => {
      await completion;
      if (direction === "rejected") throw new Error("rejected");
    });
    const Harness = observer(function Harness() {
      const container = useRef<HTMLDivElement>(null),
        bar = useRef<HTMLDivElement>(null);
      const currentBlock = store.getBlockById("owned");
      const { handleBlockDrag, handleBlockKeyDown } = useGanttResizable(currentBlock, bar, container, update);
      return createElement(
        "div",
        { ref: container, id: "test-container" },
        createElement("div", { id: "gantt-sidebar" }),
        createElement("div", {
          ref: bar,
          id: "bar",
          style: { marginLeft: currentBlock.position?.marginLeft, width: currentBlock.position?.width },
          onMouseDown: (event) => handleBlockDrag(event, direction === "rejected" ? "move" : direction),
          onKeyDown: (event) => handleBlockKeyDown(event, direction === "right" ? "right" : "left"),
        })
      );
    });
    const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = environment.IS_REACT_ACT_ENVIRONMENT;
    environment.IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(createElement(TranslationProvider, null, createElement(Harness))));
      host.querySelector("#test-container")!.getBoundingClientRect = () => ({ left: 100, width: 600 }) as DOMRect;
      host.querySelector("#gantt-sidebar")!.getBoundingClientRect = () => ({ width: 156 }) as DOMRect;
      if (input === "keyboard") {
        await act(async () =>
          host.querySelector("#bar")!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }))
        );
      } else {
        const initialX = 256 + (direction === "right" ? dayWidth * 2 + 3 : direction === "left" ? -3 : 10);
        await act(async () =>
          host
            .querySelector("#bar")!
            .dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: initialX, button: 0 }))
        );
        await act(async () =>
          document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: initialX + dayWidth }))
        );
        await act(async () => document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true })));
      }
      expect(store.isDragging).toBe(true);
      expect(update).toHaveBeenCalledWith([
        {
          id: "owned",
          meta: undefined,
          start_date: direction === "right" ? "2025-03-15" : "2025-03-16",
          target_date: direction === "left" ? "2025-03-16" : "2025-03-17",
        },
      ]);
      await act(async () => finish?.());
      expect(store.isDragging).toBe(false);
      if (direction === "rejected")
        expect(mocks.toast).toHaveBeenCalledWith(
          expect.objectContaining({ type: "error", message: expect.not.stringMatching(/Something|Error|failed/) })
        );
    } finally {
      await act(async () => root.unmount());
      host.remove();
      environment.IS_REACT_ACT_ENVIRONMENT = previous;
      await setLanguage("en");
    }
  }
);

it("uses the current hover column for both a Jalali quick-add preview and its canonical payload", async () => {
  await initPromise;
  await setLanguage("fa");
  storeFor();
  const update = vi.fn();
  const environment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        createElement(
          TranslationProvider,
          null,
          createElement(ChartAddBlock, { block: { data: { id: "owned" } } as IGanttBlock, blockUpdateHandler: update })
        )
      )
    );
    await act(async () => host.firstElementChild!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    const move = new MouseEvent("mousemove", { bubbles: true });
    Object.defineProperty(move, "offsetX", { value: 390 });
    await act(async () => host.firstElementChild!.firstElementChild!.dispatchEvent(move));
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toContain("۱ فروردین ۱۴۰۴");
    await act(async () => button.click());
    expect(update).toHaveBeenCalledWith(
      { id: "owned" },
      { start_date: "2025-03-21", target_date: "2025-03-22", meta: undefined }
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
    environment.IS_REACT_ACT_ENVIRONMENT = previous;
    await setLanguage("en");
  }
});
