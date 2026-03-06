"use client";

import * as React from "react";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import type { TElement } from "platejs";

import { DropdownMenuItemIndicator } from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import { useEditorRef, useSelectionFragmentProp } from "platejs/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBlockType, setBlockType } from "@/components/editor/transforms";

import { ToolbarButton, ToolbarMenuGroup } from "./toolbar";

export const turnIntoItems = [
  {
    icon: <PilcrowIcon size={16} />,
    keywords: ["paragraph"],
    label: "Text",
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon size={16} />,
    keywords: ["title", "h1"],
    label: "Heading 1",
    value: "h1",
  },
  {
    icon: <Heading2Icon size={16} />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    value: "h2",
  },
  {
    icon: <Heading3Icon size={16} />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    value: "h3",
  },
  {
    icon: <Heading4Icon size={16} />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    value: "h4",
  },
  {
    icon: <Heading5Icon size={16} />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    value: "h5",
  },
  {
    icon: <Heading6Icon size={16} />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    value: "h6",
  },
  {
    icon: <ListIcon size={16} />,
    keywords: ["unordered", "ul", "-"],
    label: "Bulleted list",
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon size={16} />,
    keywords: ["ordered", "ol", "1"],
    label: "Numbered list",
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon size={16} />,
    keywords: ["checklist", "task", "checkbox", "[]"],
    label: "To-do list",
    value: KEYS.listTodo,
  },
  // {
  //   icon: <ChevronRightIcon size={16} />,
  //   keywords: ["collapsible", "expandable"],
  //   label: "Toggle list",
  //   value: KEYS.toggle,
  // },
  // {
  //   icon: <FileCodeIcon size={16} />,
  //   keywords: ["```"],
  //   label: "Code",
  //   value: KEYS.codeBlock,
  // },
  // {
  //   icon: <Code2 size={16} />,
  //   keywords: [
  //     "code-drawing",
  //     "diagram",
  //     "plantuml",
  //     "graphviz",
  //     "flowchart",
  //     "mermaid",
  //   ],
  //   label: "Code Drawing",
  //   value: KEYS.codeDrawing,
  // },
  {
    icon: <QuoteIcon size={16} />,
    keywords: ["citation", "blockquote", ">"],
    label: "Quote",
    value: KEYS.blockquote,
  },
  //   {
  //     icon: <Columns3Icon size={16} />,
  //     label: '3 columns',
  //     value: 'action_three_columns',
  // },
];

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip="Turn into"
          isDropdown>
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start">
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => {
            setBlockType(editor, type);
          }}
          label="Turn into">
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[180px] pl-2 *:first:[span]:hidden text-muted-foreground"
              value={itemValue}>
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon size={16} className="text-indigo-500" />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
