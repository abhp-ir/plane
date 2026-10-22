/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// types
import { Button } from "@makeplane/propel/components/button";
import type { IProject } from "@plane/types";
import { i18nInstance, Trans, useTranslation } from "@plane/i18n";
// ui
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

// type
type TJoinProjectModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  project: IProject;
  handleClose: () => void;
};

export function JoinProjectModal(props: TJoinProjectModalProps) {
  const { handleClose, isOpen, project, workspaceSlug } = props;
  const { t, currentLocale } = useTranslation();
  // states
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);
  // store hooks
  const { joinProject } = useUserPermissions();
  // router
  const router = useAppRouter();

  const handleJoin = async () => {
    setIsJoiningLoading(true);

    await joinProject(workspaceSlug, project.id)
      .then(() => {
        router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
        handleClose();
        return;
      })
      .catch(() => {
        console.error("Error joining project");
      })
      .finally(() => {
        setIsJoiningLoading(false);
      });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="sm">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t("project_empty_state.no_access.cta_primary")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <p>
              <Trans
                i18n={i18nInstance}
                t={i18nInstance.getFixedT(currentLocale)}
                i18nKey="project_join.confirmation"
                components={{ project: <bdi className="font-semibold break-words">{project.name}</bdi> }}
              />
            </p>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t(
              isJoiningLoading
                ? "project_empty_state.no_access.cta_loading"
                : "project_empty_state.no_access.cta_primary"
            )}
            onClick={handleJoin}
            loading={isJoiningLoading}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
