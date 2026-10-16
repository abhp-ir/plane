/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { WarningTriangleOutline } from "@makeplane/propel/icons";
// Plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
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
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type DeleteProjectModal = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

const defaultValues = {
  projectName: "",
  confirmDelete: "",
};

export function DeleteProjectModal(props: DeleteProjectModal) {
  const { isOpen, project, onClose } = props;
  const { t } = useTranslation();
  // store hooks
  const { deleteProject } = useProject();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const canDelete = watch("projectName") === project?.name && watch("confirmDelete") === "delete my project";

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!workspaceSlug || !canDelete) return;

    try {
      await deleteProject(workspaceSlug.toString(), project.id);
      if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);
      handleClose();
      setToast({
        type: "success",
        title: t("toast.success"),
        message: t("entity.delete.success", { entity: t("common.project") }),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("entity.delete.failed", { entity: t("common.project") }),
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <div className="flex w-full items-center justify-start gap-6">
                <span className="place-items-center rounded-full bg-danger-subtle p-4">
                  <WarningTriangleOutline className="h-6 w-6 text-danger-primary" aria-hidden="true" />
                </span>
                <DialogHeading>
                  <DialogTitle>{t("project_settings.general.delete_project.title")}</DialogTitle>
                </DialogHeading>
              </div>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-6">
                <p dir="auto" className="text-13 leading-7 text-secondary">
                  {t("project_settings.general.delete_project.description")}
                </p>
                <div className="text-secondary">
                  <label htmlFor="projectName" className="text-13 break-words">
                    {t("project_name")}: <bdi className="font-medium text-primary">{project?.name}</bdi>
                  </label>
                  <Controller
                    control={control}
                    name="projectName"
                    render={({ field: { value, onChange, ref } }) => (
                      <Field name="projectName" invalid={Boolean(errors.projectName)}>
                        <InputGroup size="2xl">
                          <Input
                            size="2xl"
                            id="projectName"
                            dir="auto"
                            name="projectName"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder={t("project_name")}
                            autoComplete="off"
                          />
                        </InputGroup>
                      </Field>
                    )}
                  />
                </div>
                <div className="text-secondary">
                  <label htmlFor="confirmDelete" className="text-13">
                    {t("confirm")}:{" "}
                    <bdi dir="ltr" className="font-medium text-primary">
                      delete my project
                    </bdi>
                  </label>
                  <Controller
                    control={control}
                    name="confirmDelete"
                    render={({ field: { value, onChange, ref } }) => (
                      <Field name="confirmDelete" invalid={Boolean(errors.confirmDelete)}>
                        <InputGroup size="2xl">
                          <Input
                            size="2xl"
                            id="confirmDelete"
                            dir="ltr"
                            name="confirmDelete"
                            type="text"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder="delete my project"
                            autoComplete="off"
                          />
                        </InputGroup>
                      </Field>
                    )}
                  />
                </div>
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
            <Button
              variant="danger"
              size="md"
              stretch="auto"
              type="submit"
              label={isSubmitting ? t("deleting") : t("project_settings.general.delete_project.title")}
              disabled={!canDelete}
              loading={isSubmitting}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
