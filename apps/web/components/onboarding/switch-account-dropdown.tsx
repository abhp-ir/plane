/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { getFileURL } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
// hooks
import { useUser } from "@/hooks/store/user";
// components
import { SwitchAccountModal } from "./switch-account-modal";

type TSwitchAccountDropdownProps = {
  fullName?: string;
};

export const SwitchAccountDropdown = observer(function SwitchAccountDropdown(props: TSwitchAccountDropdownProps) {
  const { fullName } = props;
  const { t } = useTranslation();
  // states
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  // store hooks
  const { data: user } = useUser();

  const displayName = user?.first_name
    ? `${user?.first_name} ${user?.last_name ?? ""}`
    : fullName && fullName.trim().length > 0
      ? fullName
      : user?.email;

  if (!displayName && !fullName) return null;

  return (
    <>
      <SwitchAccountModal isOpen={showSwitchAccountModal} onClose={() => setShowSwitchAccountModal(false)} />
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              className="z-10 flex max-w-xs min-w-0 items-center gap-x-2.5 rounded-lg bg-layer-1 px-2 py-1.5"
            />
          }
        >
          <Avatar
            size="sm"
            src={user?.avatar_url ? getFileURL(user.avatar_url) : undefined}
            alt={user?.display_name ?? displayName}
            fallback={fullName?.[0] ?? "R"}
          />
          <bdi title={displayName} className="min-w-0 truncate text-13 font-medium text-secondary">
            {displayName}
          </bdi>
        </MenuTrigger>
        <MenuContent side="bottom" align="end">
          <MenuItem
            variant="danger"
            label={t("onboarding.switch_account.wrong_email")}
            onClick={() => setShowSwitchAccountModal(true)}
          />
        </MenuContent>
      </Menu>
    </>
  );
});
