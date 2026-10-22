/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ToastList, ToastViewport } from "@makeplane/propel/components/toast";
import { Toast as BaseToast } from "@base-ui/react/toast";
import { CloseOutline } from "@makeplane/propel/icons";
import type { ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { toastManager } from "./toast-manager";

export type PlaneToastProviderProps = {
  children?: ReactNode;
};

/**
 * Propel's composite fixes the viewport label; compose its existing parts so the shared region can be localized.
 */
export function PlaneToastProvider({ children }: PlaneToastProviderProps) {
  // plane hooks
  const { t } = useTranslation();

  return (
    <BaseToast.Provider toastManager={toastManager}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport aria-label={t("notifications")} render={<ToastViewport />}>
          <ToastList
            close={
              <IconButton variant="ghost" size="xs" aria-label={t("close")} icon={<PropelIcon icon={CloseOutline} />} />
            }
          />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
PlaneToastProvider.displayName = "blocks.PlaneToastProvider";
