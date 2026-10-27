"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

type Shortcut = { keys: string[]; label: string; where?: string };
type Section = { title: string; items: Shortcut[] };

// "mod" wird je nach System als ⌘ oder Strg angezeigt.
const SECTIONS: Section[] = [
  {
    title: "Im Text verknüpfen",
    items: [
      { keys: ["@"], label: "Person erwähnen (benachrichtigt sie)" },
      { keys: ["#"], label: "Fall verknüpfen" },
      { keys: ["!"], label: "Todo verknüpfen", where: "Protokolle" },
      { keys: ["$"], label: "Termin verknüpfen", where: "Protokolle" },
      { keys: ["/"], label: "Befehlsmenü (Tabelle, Bild, …)", where: "Protokolle" },
      { keys: [":"], label: "Emoji einfügen", where: "Protokolle" },
    ],
  },
  {
    title: "Formatieren",
    items: [
      { keys: ["mod", "B"], label: "Fett" },
      { keys: ["mod", "I"], label: "Kursiv" },
      { keys: ["mod", "U"], label: "Unterstrichen" },
      { keys: ["mod", "E"], label: "Code" },
      { keys: ["mod", "⇧", "X"], label: "Durchgestrichen" },
      { keys: ["mod", "⇧", "H"], label: "Markieren" },
      { keys: ["mod", "alt", "1–3"], label: "Überschrift 1–3" },
      { keys: ["mod", "⇧", "."], label: "Zitat" },
    ],
  },
  {
    title: "Beim Tippen (Zeilenanfang)",
    items: [
      { keys: ["-", "Leertaste"], label: "Aufzählung" },
      { keys: ["1.", "Leertaste"], label: "Nummerierte Liste" },
      { keys: ["[]", "Leertaste"], label: "Checkliste" },
      { keys: [">", "Leertaste"], label: "Zitat" },
      { keys: ["**Text**"], label: "Fett" },
      { keys: ["*Text*"], label: "Kursiv" },
    ],
  },
  {
    title: "Allgemein",
    items: [
      { keys: ["?"], label: "Diese Hilfe öffnen" },
      { keys: ["mod", "B"], label: "Seitenleiste ein-/ausblenden", where: "außerhalb von Texten" },
      { keys: ["Esc"], label: "Dialog schließen" },
    ],
  },
];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export default function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isMac, setIsMac] = React.useState(true);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  // "?" öffnet die Hilfe von überall, außer beim Schreiben.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      onOpenChange(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const keyLabel = (k: string) =>
    k === "mod" ? (isMac ? "⌘" : "Strg") : k === "alt" ? (isMac ? "⌥" : "Alt") : k;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Hilfe &amp; Tastenkürzel</DialogTitle>
          <DialogDescription>
            Gilt in Protokollen und Kommentaren, sofern nicht anders angegeben.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-x-10 gap-y-6 pb-2 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
                <ul className="divide-y">
                  {section.items.map((item) => (
                    <li
                      key={item.label + item.keys.join()}
                      className="flex items-center justify-between gap-4 py-1.5 text-sm">
                      <span>
                        {item.label}
                        {item.where ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({item.where})
                          </span>
                        ) : null}
                      </span>
                      <KbdGroup className="shrink-0">
                        {item.keys.map((k) => (
                          <Kbd key={k}>{keyLabel(k)}</Kbd>
                        ))}
                      </KbdGroup>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
}
