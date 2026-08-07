"use client";

import * as React from "react";
import { useTocSideBar, useTocSideBarState } from "@platejs/toc/react";
import { cn } from "@/lib/utils";

/**
 * Klickbare Überschriften-Navigation neben dem Editor (springt beim Klick
 * zur jeweiligen Section, hebt die aktuell sichtbare Section beim Scrollen hervor).
 */
export function ProtocolTocSidebar() {
  const state = useTocSideBarState({ open: true, topOffset: 80 });
  const { navProps, onContentClick } = useTocSideBar(state);
  const { activeContentId, headingList } = state;

  if (headingList.length === 0) return null;

  return (
    <nav
      {...navProps}
      contentEditable={false}
      className="sticky top-20 hidden max-h-[70vh] w-44 shrink-0 overflow-y-auto rounded-xl border bg-muted/40 p-2 text-xs xl:block">
      <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Inhalt
      </p>
      <ul className="space-y-1">
        {headingList.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={(e) => onContentClick(e, item, "smooth")}
              aria-current={
                item.id === activeContentId ? "location" : undefined
              }
              style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}
              className={cn(
                "block w-full truncate rounded-md px-2 py-1 text-left transition-colors",
                item.id === activeContentId
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}>
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
