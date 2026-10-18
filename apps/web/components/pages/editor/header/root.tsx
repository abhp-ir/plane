/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ReactionOutline } from "@makeplane/propel/icons";
// plane imports
import { EmojiPicker, Logo } from "@plane/blocks/emoji-icon-picker";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  projectId?: string;
};

export const PageEditorHeaderRoot = observer(function PageEditorHeaderRoot(props: Props) {
  const { page } = props;
  const { t } = useTranslation();
  // states
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  // derived values
  const { isContentEditable, logo_props, name, updatePageLogo } = page;
  const isLogoSelected = !!logo_props?.in_use;
  const isTitleEmpty = !name || name.trim() === "";

  return (
    <div
      className={cn("flex h-[56px] items-end pb-2 text-start transition-[height] duration-300 ease-linear", {
        "h-[112px] pb-0": isLogoSelected,
      })}
    >
      <div
        className={cn(
          "opacity-0 transition-opacity duration-200 group-hover/page-header:opacity-100 focus-within:opacity-100",
          { "opacity-100": isLogoSelected || isTitleEmpty }
        )}
      >
        <EmojiPicker
          isOpen={isLogoPickerOpen}
          handleToggle={setIsLogoPickerOpen}
          buttonClassName={cn(
            "rounded-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset",
            isLogoSelected
              ? "-ms-[8px] grid size-[56px] place-items-center"
              : "flex items-center gap-1 p-1 text-13 font-medium text-tertiary",
            { "hover:bg-layer-1": isContentEditable, "bg-layer-1": isLogoPickerOpen }
          )}
          label={
            isLogoSelected ? (
              <>
                <span className="sr-only">{t("common.icon.change")}</span>
                <span aria-hidden="true">
                  <Logo logo={logo_props} size={48} type="lucide" />
                </span>
              </>
            ) : (
              <>
                <ReactionOutline className="size-4 flex-shrink-0" />
                {t("common.icon.add")}
              </>
            )
          }
          onChange={updatePageLogo}
          defaultIconColor={logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined}
          defaultOpen={logo_props?.in_use && logo_props?.in_use === "emoji" ? "emoji" : "icon"}
          disabled={!isContentEditable}
        />
      </div>
    </div>
  );
});
