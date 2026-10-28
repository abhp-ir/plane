/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
// plane imports
import { TooltipPopup } from "@makeplane/propel/elements/tooltip";
import type { SingleOrArray, TFilterValue } from "@plane/types";
import { hasValidValue, cn } from "@plane/utils";

interface FilterItemContainerProps {
  children: React.ReactNode;
  conditionValue: SingleOrArray<TFilterValue>;
  showTransition: boolean;
  variant?: "default" | "error";
  tooltipContent?: string;
}

export function FilterItemContainer(props: FilterItemContainerProps) {
  const { children, conditionValue, showTransition, variant = "default", tooltipContent } = props;
  // refs
  const itemRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const [tooltipElement, setTooltipElement] = useState<HTMLDivElement | null>(null);

  // effects
  useEffect(() => {
    if (!showTransition) return;

    const element = itemRef.current;
    if (!element) return;

    if (hasValidValue(conditionValue)) return;

    const applyInitialStyles = () => {
      element.style.opacity = "0";
      element.style.transform = "scale(0.95)";
    };

    const applyFinalStyles = () => {
      // Force a reflow to ensure the initial state is applied
      void element.offsetWidth;
      element.style.opacity = "1";
      element.style.transform = "scale(1)";
    };

    applyInitialStyles();
    applyFinalStyles();

    return () => {
      applyInitialStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip.Root disabled={!tooltipContent}>
      <Tooltip.Trigger
        aria-describedby={tooltipElement ? tooltipId : undefined}
        render={
          <div
            ref={itemRef}
            className={cn("flex h-7 items-stretch overflow-hidden rounded-sm border transition-all duration-200", {
              "border-subtle bg-surface-1": variant === "default",
              "border-danger-strong bg-surface-2": variant === "error",
            })}
          >
            {children}
          </div>
        }
      />
      {tooltipContent && (
        <Tooltip.Portal>
          <Tooltip.Positioner
            side="bottom"
            sideOffset={8}
            collisionPadding={8}
            className="z-50 outline-none data-[anchor-hidden]:invisible"
          >
            <Tooltip.Popup
              ref={setTooltipElement}
              id={tooltipId}
              role="tooltip"
              render={<TooltipPopup layout="stacked" />}
              style={{ maxWidth: "min(500px, calc(100vw - 1rem))" }}
            >
              {tooltipContent}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      )}
    </Tooltip.Root>
  );
}
