/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Placeholder } from "@tiptap/extension-placeholder";
import { Plugin } from "@tiptap/pm/state";
import { i18nInstance } from "@plane/i18n";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { IEditorProps } from "@/types";

type TArgs = {
  placeholder: IEditorProps["placeholder"];
  showPlaceholderOnEmpty: IEditorProps["showPlaceholderOnEmpty"];
};

export const LocalizedPlaceholder = Placeholder.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        view: (view) => {
          const refresh = () => view.dispatch(view.state.tr.setMeta("addToHistory", false));
          i18nInstance.on("languageChanged", refresh);
          return { destroy: () => i18nInstance.off("languageChanged", refresh) };
        },
      }),
    ];
  },
});

export const CustomPlaceholderExtension = (args: TArgs) => {
  const { placeholder, showPlaceholderOnEmpty = false } = args;

  return LocalizedPlaceholder.configure({
    placeholder: ({ editor, node }) => {
      if (!editor.isEditable) return "";

      if (node.type.name === CORE_EXTENSIONS.HEADING)
        return i18nInstance.t(`editor_commands.h${node.attrs.level}.title`);

      const isUploadInProgress = editor.storage.utility?.uploadInProgress;

      if (isUploadInProgress) return "";

      const shouldHidePlaceholder =
        editor.isActive(CORE_EXTENSIONS.TABLE) ||
        editor.isActive(CORE_EXTENSIONS.CODE_BLOCK) ||
        editor.isActive(CORE_EXTENSIONS.IMAGE) ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE);

      if (shouldHidePlaceholder) return "";

      if (showPlaceholderOnEmpty) {
        const isDocumentEmpty = editor.state.doc.textContent.length === 0;
        if (!isDocumentEmpty) {
          return "";
        }
      }

      if (placeholder) {
        if (typeof placeholder === "string") return placeholder;
        else return placeholder(editor.isFocused, editor.getHTML());
      }

      return i18nInstance.t("common.press_for_commands");
    },
    includeChildren: true,
  });
};
