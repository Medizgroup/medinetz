'use client';

import * as React from 'react';

import {
  type DropdownMenuProps,
  DropdownMenuItemIndicator,
} from '@radix-ui/react-dropdown-menu';
import { CheckIcon, EyeIcon, PenIcon } from 'lucide-react';
import { useEditorReadOnly, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProtocolEditorContext } from '@/components/protocols/protocol-editor-context';

import { ToolbarButton } from './toolbar';

export function ModeToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const { canEdit } = useProtocolEditorContext();
  const [open, setOpen] = React.useState(false);

  const value = readOnly ? 'viewing' : 'editing';

  const item: Record<string, { icon: React.ReactNode; label: string }> = {
    editing: {
      icon: <PenIcon />,
      label: 'Editing',
    },
    viewing: {
      icon: <EyeIcon />,
      label: 'Viewing',
    },
  };

  // Reine Betrachter:innen dürfen nicht in den Editing-Modus wechseln — kein
  // Umschalter, nur eine gesperrte Anzeige, was gerade aktiv ist.
  if (!canEdit) {
    return (
      <ToolbarButton disabled tooltip="Nur Lesezugriff">
        <EyeIcon />
        <span className="hidden lg:inline">Viewing</span>
      </ToolbarButton>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Editing mode" isDropdown>
          {item[value].icon}
          <span className="hidden lg:inline">{item[value].label}</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuRadioGroup
          onValueChange={(newValue) => {
            editor.store.setReadOnly(newValue === 'viewing');

            if (newValue === 'editing') {
              editor.tf.focus();
            }
          }}
          value={value}
        >
          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="editing"
          >
            <Indicator />
            {item.editing.icon}
            {item.editing.label}
          </DropdownMenuRadioItem>

          <DropdownMenuRadioItem
            className="pl-2 *:first:[span]:hidden *:[svg]:text-muted-foreground"
            value="viewing"
          >
            <Indicator />
            {item.viewing.icon}
            {item.viewing.label}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Indicator() {
  return (
    <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <CheckIcon />
      </DropdownMenuItemIndicator>
    </span>
  );
}
