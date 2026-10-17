/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
// plane imports
import { ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE, MAX_FILE_SIZE } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { UserOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { EFileAssetType } from "@plane/types";
import { getAssetIdFromUrl, getFileURL, checkURLValidity } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { FileService } from "@/services/file.service";

type Props = {
  handleRemove: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  value: string | null;
};

// services
const fileService = new FileService();

export const WorkspaceImageUploadModal = observer(function WorkspaceImageUploadModal(props: Props) {
  const { handleRemove, isOpen, onClose, onSuccess, value } = props;
  const { t } = useTranslation();
  // states
  const [image, setImage] = useState<File | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentWorkspace, updateWorkspaceLogo } = useWorkspace();

  const onDrop = (acceptedFiles: File[]) => setImage(acceptedFiles[0] ?? null);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const handleClose = () => {
    setIsImageUploading(false);
    onClose();
    setTimeout(() => {
      setImage(null);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!image || !workspaceSlug || !currentWorkspace) return;
    setIsImageUploading(true);

    try {
      const { asset_url } = await fileService.uploadWorkspaceAsset(
        workspaceSlug.toString(),
        {
          entity_identifier: currentWorkspace.id,
          entity_type: EFileAssetType.WORKSPACE_LOGO,
        },
        image
      );
      updateWorkspaceLogo(workspaceSlug.toString(), asset_url);
      onSuccess(asset_url);
    } catch (error: unknown) {
      console.error("Error uploading workspace image:", error);
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("attachment.error"),
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!workspaceSlug || !value) return;
    setIsRemoving(true);
    try {
      if (checkURLValidity(value)) {
        await fileService.deleteOldWorkspaceAsset(currentWorkspace?.id ?? "", value);
      } else {
        const assetId = getAssetIdFromUrl(value);
        await fileService.deleteWorkspaceAsset(workspaceSlug.toString(), assetId);
      }
      await handleRemove();
      handleClose();
    } catch (error) {
      console.error("Error removing workspace image:", error);
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("entity.remove.failed", { entity: t("image_upload.alt") }),
      });
    } finally {
      setIsRemoving(false);
    }
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
              <DialogTitle>{t("onboarding.image.upload")}</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody tabIndex={0}>
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div
                    {...getRootProps({
                      role: "button",
                      "aria-label": t(image || value ? "onboarding.image.change" : "onboarding.image.upload"),
                    })}
                    className={`relative grid aspect-square w-full max-w-80 cursor-pointer place-items-center rounded-lg p-4 text-center focus:ring-2 focus:ring-accent-strong focus:ring-offset-2 focus:outline-none sm:p-12 ${
                      (image === null && isDragActive) || !value
                        ? "border-2 border-dashed border-subtle hover:bg-surface-2"
                        : ""
                    }`}
                  >
                    {image !== null || (value && value !== "") ? (
                      <>
                        <span className="absolute end-0 top-0 z-40 translate-x-1/2 -translate-y-1/2 rounded-sm bg-surface-2 px-2 py-0.5 text-11 font-medium text-secondary rtl:-translate-x-1/2">
                          {t("edit")}
                        </span>
                        <img
                          src={image ? URL.createObjectURL(image) : value ? getFileURL(value) : ""}
                          alt={t("image_upload.alt")}
                          className="absolute top-0 left-0 h-full w-full rounded-md object-cover"
                        />
                      </>
                    ) : (
                      <div>
                        <UserOutline className="mx-auto h-16 w-16 text-secondary" />
                        <span className="mt-2 block text-13 font-medium text-secondary">
                          {t(isDragActive ? "image_upload.drop" : "image_upload.drag_drop")}
                        </span>
                      </div>
                    )}

                    <input {...getInputProps({ "aria-label": t("onboarding.image.upload") })} />
                  </div>
                </div>
                {fileRejections.length > 0 && (
                  <p role="alert" className="text-13 text-danger-primary">
                    {fileRejections[0].errors[0].code === "file-too-large"
                      ? t("attachment.file_size_limit", { size: MAX_FILE_SIZE / (1024 * 1024) })
                      : t("file_upload.invalid_file_type")}
                  </p>
                )}
              </div>
              <p className="text-13 text-secondary">
                {t("image_upload.formats")} <bdi dir="ltr">.jpeg, .jpg, .png, .webp</bdi>
              </p>
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <DialogInfo>
            <Button
              variant="danger"
              size="md"
              stretch="auto"
              label={isRemoving ? t("removing") : t("remove")}
              onClick={handleImageRemove}
              disabled={!value}
              loading={isRemoving}
            />
          </DialogInfo>
          <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t(
              isImageUploading
                ? "workspace_settings.settings.applications.uploading"
                : "workspace_settings.settings.applications.upload_and_save"
            )}
            onClick={handleSubmit}
            disabled={!image}
            loading={isImageUploading}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
