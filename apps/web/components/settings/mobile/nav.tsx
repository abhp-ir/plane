/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId, useRef } from "react";
import { observer } from "mobx-react";
import { Menu } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { ChevronRightOutline } from "@makeplane/propel/icons";
import { useUserSettings } from "@/hooks/store/user";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

type Props = {
  hamburgerContent: React.ComponentType<{ className?: string; isMobile?: boolean }>;
  activePath: string;
};

export const SettingsMobileNav = observer(function SettingsMobileNav(props: Props) {
  const { hamburgerContent: HamburgerContent, activePath } = props;
  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sidebarId = useId();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useUserSettings();
  const { t } = useTranslation();

  useOutsideClickDetector(sidebarRef, () => {
    if (!sidebarCollapsed) toggleSidebar(true);
  });

  return (
    <div className="flex items-center gap-4 border-b border-subtle px-page-x py-3 md:hidden">
      <div
        ref={sidebarRef}
        role="group"
        className="relative z-50 w-fit"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !sidebarCollapsed) {
            event.preventDefault();
            toggleSidebar(true);
            triggerRef.current?.focus();
          }
        }}
      >
        {!sidebarCollapsed && (
          <div id={sidebarId} className="absolute start-0 top-10.5 z-50">
            <HamburgerContent className="max-h-100 rounded-lg border border-subtle pb-3" />
          </div>
        )}
        <IconButton
          ref={triggerRef}
          variant="secondary"
          size="sm"
          render={<button type="button" className="group z-50 shrink-0" />}
          icon={<Icon icon={Menu} />}
          aria-label={t("settings")}
          aria-expanded={!sidebarCollapsed}
          aria-controls={sidebarCollapsed ? undefined : sidebarId}
          onClick={() => toggleSidebar()}
        />
      </div>
      {/* path */}
      <div className="flex items-center gap-2">
        <ChevronRightOutline className="size-4 text-tertiary rtl:rotate-180" />
        <span className="text-13 font-medium text-secondary">{t(activePath)}</span>
      </div>
    </div>
  );
});
