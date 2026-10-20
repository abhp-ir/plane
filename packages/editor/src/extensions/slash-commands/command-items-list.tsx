/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Smile } from "lucide-react";
import { i18nInstance } from "@plane/i18n";
import { normalizeSlashCommandQuery } from "@/helpers/slash-command-search";
import {
  ChatOutline,
  CodeOutline,
  H1Outline,
  H2Outline,
  H3Outline,
  H4Outline,
  H5Outline,
  H6Outline,
  ImageOutline,
  ListOutline,
  MinusSquareOutline,
  NumberedListOutline,
  QuoteOutline,
  TableEditorOutline,
  TextOutline,
  ToDoOutline,
} from "@makeplane/propel/icons";
// constants
import { COLORS_LIST } from "@/constants/common";
// helpers
import {
  insertTableCommand,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleHeading,
  toggleTextColor,
  toggleBackgroundColor,
  insertImage,
  insertCallout,
  setText,
  openEmojiPicker,
} from "@/helpers/editor-commands";
// plane editor extensions
import { coreEditorAdditionalSlashCommandOptions } from "@/extensions/additional-slash-command-options";
// types
import type { CommandProps, ISlashCommandItem, TSlashCommandSectionKeys } from "@/types";
// local types
import type { TExtensionProps, TSlashCommandAdditionalOption } from "./root";

export type TSlashCommandSection = {
  key: TSlashCommandSectionKeys;
  title?: string;
  items: ISlashCommandItem[];
};

export const getSlashCommandFilteredSections =
  (args: TExtensionProps) =>
  ({ query }: { query: string }): TSlashCommandSection[] => {
    const { additionalOptions: externalAdditionalOptions, disabledExtensions, flaggedExtensions } = args;
    if (typeof query !== "string") return [];
    const normalizedQuery = normalizeSlashCommandQuery(query);
    const english = i18nInstance.getFixedT("en");
    const localizeItem = (item: ISlashCommandItem): ISlashCommandItem => ({
      ...item,
      title: i18nInstance.t(item.title),
      description: i18nInstance.t(item.description),
      searchTerms: [english(item.title), english(item.description), item.commandKey, ...item.searchTerms],
    });
    const SLASH_COMMAND_SECTIONS: TSlashCommandSection[] = [
      {
        key: "general",
        items: [
          {
            commandKey: "text",
            key: "text",
            title: "editor_commands.text.title",
            description: "editor_commands.text.description",
            searchTerms: ["p", "paragraph"],
            icon: <TextOutline className="size-3.5" />,
            command: ({ editor, range }) => setText(editor, range),
          },
          {
            commandKey: "h1",
            key: "h1",
            title: "editor_commands.h1.title",
            description: "editor_commands.h1.description",
            searchTerms: ["title", "big", "large"],
            icon: <H1Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 1, range),
          },
          {
            commandKey: "h2",
            key: "h2",
            title: "editor_commands.h2.title",
            description: "editor_commands.h2.description",
            searchTerms: ["subtitle", "medium"],
            icon: <H2Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 2, range),
          },
          {
            commandKey: "h3",
            key: "h3",
            title: "editor_commands.h3.title",
            description: "editor_commands.h3.description",
            searchTerms: ["subtitle", "small"],
            icon: <H3Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 3, range),
          },
          {
            commandKey: "h4",
            key: "h4",
            title: "editor_commands.h4.title",
            description: "editor_commands.h3.description",
            searchTerms: ["subtitle", "small"],
            icon: <H4Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 4, range),
          },
          {
            commandKey: "h5",
            key: "h5",
            title: "editor_commands.h5.title",
            description: "editor_commands.h3.description",
            searchTerms: ["subtitle", "small"],
            icon: <H5Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 5, range),
          },
          {
            commandKey: "h6",
            key: "h6",
            title: "editor_commands.h6.title",
            description: "editor_commands.h3.description",
            searchTerms: ["subtitle", "small"],
            icon: <H6Outline className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 6, range),
          },

          {
            commandKey: "numbered-list",
            key: "numbered-list",
            title: "editor_commands.numbered-list.title",
            description: "editor_commands.numbered-list.description",
            searchTerms: ["ordered"],
            icon: <NumberedListOutline className="size-3.5" />,
            command: ({ editor, range }) => toggleOrderedList(editor, range),
          },
          {
            commandKey: "bulleted-list",
            key: "bulleted-list",
            title: "editor_commands.bulleted-list.title",
            description: "editor_commands.bulleted-list.description",
            searchTerms: ["unordered", "point"],
            icon: <ListOutline className="size-3.5" />,
            command: ({ editor, range }) => toggleBulletList(editor, range),
          },
          {
            commandKey: "to-do-list",
            key: "to-do-list",
            title: "editor_commands.to-do-list.title",
            description: "editor_commands.to-do-list.description",
            searchTerms: ["todo", "task", "list", "check", "checkbox"],
            icon: <ToDoOutline className="size-3.5" />,
            command: ({ editor, range }) => toggleTaskList(editor, range),
          },
          {
            commandKey: "table",
            key: "table",
            title: "editor_commands.table.title",
            description: "editor_commands.table.description",
            searchTerms: ["table", "cell", "db", "data", "tabular"],
            icon: <TableEditorOutline className="size-3.5" />,
            command: ({ editor, range }) => insertTableCommand(editor, range),
          },
          {
            commandKey: "quote",
            key: "quote",
            title: "editor_commands.quote.title",
            description: "editor_commands.quote.description",
            searchTerms: ["blockquote"],
            icon: <QuoteOutline className="size-3.5" />,
            command: ({ editor, range }) => toggleBlockquote(editor, range),
          },
          {
            commandKey: "code",
            key: "code",
            title: "editor_commands.code.title",
            description: "editor_commands.code.description",
            searchTerms: ["codeblock"],
            icon: <CodeOutline className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
          },
          {
            commandKey: "callout",
            key: "callout",
            title: "editor_commands.callout.title",
            icon: <ChatOutline className="size-3.5" />,
            description: "editor_commands.callout.description",
            searchTerms: ["callout", "comment", "message", "info", "alert"],
            command: ({ editor, range }: CommandProps) => insertCallout(editor, range),
          },
          {
            commandKey: "divider",
            key: "divider",
            title: "editor_commands.divider.title",
            description: "editor_commands.divider.description",
            searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
            icon: <MinusSquareOutline className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
          },
          {
            commandKey: "emoji",
            key: "emoji",
            title: "common.emoji.label",
            description: "editor_commands.emoji.description",
            searchTerms: ["emoji", "icons", "reaction", "emoticon", "emotags"],
            icon: <Smile className="size-3.5" />,
            command: ({ editor, range }) => {
              openEmojiPicker(editor, range);
            },
          },
        ],
      },
      {
        key: "text-colors",
        title: "editor_commands.text-color.title",
        items: [
          {
            commandKey: "text-color",
            key: "text-color-default",
            title: "common.default",
            description: "editor_commands.text-color.description",
            searchTerms: ["color", "text", "default"],
            icon: <TextOutline className="size-3.5 text-primary" />,
            command: ({ editor, range }) => toggleTextColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "text-color",
                key: `text-color-${color.key}`,
                title: `editor_colors.${color.key}`,
                description: "editor_commands.text-color.description",
                searchTerms: ["color", "text", color.label],

                icon: (
                  <TextOutline
                    className="size-3.5"
                    style={{
                      color: color.textColor,
                    }}
                  />
                ),

                command: ({ editor, range }) => toggleTextColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
      {
        key: "background-colors",
        title: "editor_commands.background-color.title",
        items: [
          {
            commandKey: "background-color",
            key: "background-color-default",
            title: "editor_commands.background-color.default",
            description: "editor_commands.background-color.description",
            searchTerms: ["color", "bg", "background", "default"],
            icon: <TextOutline className="size-3.5" />,
            iconContainerStyle: {
              borderRadius: "4px",
              backgroundColor: "var(--background-color-surface-1)",
              border: "1px solid var(--border-color-strong)",
            },
            command: ({ editor, range }) => toggleBackgroundColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "background-color",
                key: `background-color-${color.key}`,
                title: `editor_colors.${color.key}`,
                description: "editor_commands.background-color.description",
                searchTerms: ["color", "bg", "background", color.label],
                icon: <TextOutline className="size-3.5" />,

                iconContainerStyle: {
                  borderRadius: "4px",
                  backgroundColor: color.backgroundColor,
                },

                command: ({ editor, range }) => toggleBackgroundColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
    ];

    for (const section of SLASH_COMMAND_SECTIONS) {
      if (section.title) section.title = i18nInstance.t(section.title);
      section.items = section.items.map(localizeItem);
    }

    const internalAdditionalOptions: TSlashCommandAdditionalOption[] = [];
    if (!disabledExtensions?.includes("image")) {
      internalAdditionalOptions.push({
        ...localizeItem({
          commandKey: "image",
          key: "image",
          title: "image_upload.alt",
          icon: <ImageOutline className="size-3.5" />,
          description: "editor_commands.image.description",
          searchTerms: ["img", "photo", "picture", "media", "upload"],
          command: ({ editor, range }: CommandProps) => insertImage({ editor, event: "insert", range }),
        }),
        section: "general",
        pushAfter: "code",
      });
    }

    [
      ...internalAdditionalOptions,
      ...(externalAdditionalOptions ?? []),
      ...coreEditorAdditionalSlashCommandOptions({
        disabledExtensions,
        flaggedExtensions,
      }),
    ]?.forEach((item) => {
      const sectionToPushTo = SLASH_COMMAND_SECTIONS.find((s) => s.key === item.section) ?? SLASH_COMMAND_SECTIONS[0];
      const itemIndexToPushAfter = sectionToPushTo.items.findIndex((i) => i.commandKey === item.pushAfter);
      if (itemIndexToPushAfter !== -1) {
        sectionToPushTo.items.splice(itemIndexToPushAfter + 1, 0, item);
      } else {
        sectionToPushTo.items.push(item);
      }
    });

    for (const section of SLASH_COMMAND_SECTIONS) {
      section.items = section.items.filter((item) => {
        return [item.title, item.description, section.title ?? "", ...item.searchTerms].some((value) =>
          normalizeSlashCommandQuery(value).includes(normalizedQuery)
        );
      });
    }

    return SLASH_COMMAND_SECTIONS.filter((s) => s.items.length !== 0);
  };
