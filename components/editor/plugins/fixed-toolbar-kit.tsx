"use client";

import { createPlatePlugin } from "platejs/react";

import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { FixedToolbarButtons } from "@/components/ui/fixed-toolbar-buttons";

export const FixedToolbarKit = [
  createPlatePlugin({
    key: "fixed-toolbar",
    render: {
      beforeEditable: () => (
        <FixedToolbar className="sticky top-1 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 overflow-x-auto">
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
];
