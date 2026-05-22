/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";

import {
  AvatarConfig,
  buildAvatarUrl,
  defaultAvatarConfig,
  BG,
  HEAD,
  HAIR,
  EYES,
  NOSE,
  MOUTH,
  HAIRACCESSORIES,
  FRECKLES,
  GLASSES,
  BEARD,
  EARRINGS,
} from "@/lib/avatar/dicebear";
import Image from "next/image";
import { toastManager } from "../ui/toast";
import { Repeat } from "@solar-icons/react-perf/category/style/LineDuotone";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { saveAvatarUrlAction } from "@/app/(app)/actions/users/profile";

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function AvatarSelect(props: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const {
    label,
    value,
    options,
    onChange,
    allowNone,
    noneLabel = "Keine",
  } = props;
  return (
    <Field className="gap-2">
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(v) => typeof v === "string" && onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder={`${label} wählen`} />
        </SelectTrigger>
        <SelectPopup
          alignItemWithTrigger={false}
          className="max-h-48 overflow-auto">
          {allowNone && <SelectItem value="none">{noneLabel}</SelectItem>}
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Field>
  );
}

export function LoreleiAvatarDialog(props: {
  seed: string;
  config?: AvatarConfig | null;
  onPick: (result: { config: AvatarConfig; url: string }) => void;
}) {
  const { seed, config, onPick } = props;

  const [open, setOpen] = React.useState(false);

  const initial = React.useMemo(
    () => config ?? defaultAvatarConfig(seed),
    [config, seed],
  );
  const [cfg, setCfg] = React.useState<AvatarConfig>(initial);

  // Beim Öffnen immer auf die gespeicherte Config zurücksetzen
  React.useEffect(() => {
    if (open) setCfg(initial);
  }, [open, initial]);

  const set = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  // Preview lokal via @dicebear/core (kein Netzwerk-Roundtrip pro Änderung)
  const svg = React.useMemo(() => {
    const base: Record<string, unknown> = {
      seed: cfg.seed,
      size: 128,
      radius: 20,
      backgroundColor: [cfg.backgroundColor],
      head: [cfg.head],
      hair: [cfg.hair],
      eyes: [cfg.eyes],
      nose: [cfg.nose],
      mouth: [cfg.mouth],
    };
    const opt = (key: string, probKey: string, value: string) => {
      if (value !== "none") {
        base[key] = [value];
        base[probKey] = 100;
      } else {
        base[probKey] = 0;
      }
    };
    opt("hairAccessories", "hairAccessoriesProbability", cfg.hairAccessories);
    opt("freckles", "frecklesProbability", cfg.freckles);
    opt("glasses", "glassesProbability", cfg.glasses);
    opt("beard", "beardProbability", cfg.beard);
    opt("earrings", "earringsProbability", cfg.earrings);
    return createAvatar(lorelei, base).toString();
  }, [cfg]);

  const previewSrc = React.useMemo(() => svgToDataUri(svg), [svg]);

  const handleSave = () => {
    onPick({ config: cfg, url: buildAvatarUrl(cfg) });

    setOpen(false);

    // Fehlerbehandlung: Fehler anzeigen oder ignorieren, Erfolg egal weil das Formular erst durch "Speichern" wirklich übernommen wird.
    saveAvatarUrlAction(buildAvatarUrl(cfg)).catch(() => {
      toastManager.add({
        title: "Avatar konnte nicht gespeichert werden.",
        type: "error",
      });
    });
    toastManager.add({
      title: "Avatar aktualisiert",
      type: "success",
    });
  };

  const handleRandomize = () => {
    setCfg({
      seed: cfg.seed,
      backgroundColor: pick(BG),
      head: pick(HEAD),
      hair: pick(HAIR),
      eyes: pick(EYES),
      nose: pick(NOSE),
      mouth: pick(MOUTH),
      hairAccessories: Math.random() > 0.75 ? pick(HAIRACCESSORIES) : "none",
      freckles: Math.random() > 0.7 ? pick(FRECKLES) : "none",
      glasses: Math.random() > 0.6 ? pick(GLASSES) : "none",
      beard: Math.random() > 0.8 ? pick(BEARD) : "none",
      earrings: Math.random() > 0.8 ? pick(EARRINGS) : "none",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-full" />}>
        Avatar bearbeiten
      </DialogTrigger>

      <DialogPopup className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Avatar bearbeiten</DialogTitle>
          <DialogDescription>
            Personalisiere deinen Lorelei-Avatar oder lass ihn zufällig
            generieren.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="flex flex-col items-center gap-3 h-80 pb-4">
            <Image
              width={276}
              height={276}
              src={previewSrc}
              alt="Avatar preview"
              className="size-62 overflow-hidden rounded-full "
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xl"
                  onClick={handleRandomize}
                  className="rounded-full bg-accent">
                  <Repeat className="" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zufällig generieren </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 gap-y-6 sm:grid-cols-3">
              <AvatarSelect
                label="Kopf"
                value={cfg.head}
                options={HEAD}
                onChange={(v) => set("head", v)}
              />
              <AvatarSelect
                label="Haare"
                value={cfg.hair}
                options={HAIR}
                onChange={(v) => set("hair", v)}
              />
              <AvatarSelect
                label="Haarschmuck"
                value={cfg.hairAccessories}
                options={HAIRACCESSORIES}
                onChange={(v) => set("hairAccessories", v)}
                allowNone
              />
              <AvatarSelect
                label="Augen"
                value={cfg.eyes}
                options={EYES}
                onChange={(v) => set("eyes", v)}
              />
              <AvatarSelect
                label="Nase"
                value={cfg.nose}
                options={NOSE}
                onChange={(v) => set("nose", v)}
              />
              <AvatarSelect
                label="Mund"
                value={cfg.mouth}
                options={MOUTH}
                onChange={(v) => set("mouth", v)}
              />
              <AvatarSelect
                label="Sommersprossen"
                value={cfg.freckles}
                options={FRECKLES}
                onChange={(v) => set("freckles", v)}
                allowNone
              />
              <AvatarSelect
                label="Brille"
                value={cfg.glasses}
                options={GLASSES}
                onChange={(v) => set("glasses", v)}
                allowNone
              />
              <AvatarSelect
                label="Bart"
                value={cfg.beard}
                options={BEARD}
                onChange={(v) => set("beard", v)}
                allowNone
                noneLabel="Keiner"
              />
              <AvatarSelect
                label="Ohrringe"
                value={cfg.earrings}
                options={EARRINGS}
                onChange={(v) => set("earrings", v)}
                allowNone
              />

              {/* Hintergrund mit Farb-Swatch bleibt eigenständig */}
              <Field className="gap-2 ">
                <FieldLabel>Hintergrund</FieldLabel>
                <Select
                  value={cfg.backgroundColor}
                  onValueChange={(v) =>
                    typeof v === "string" && set("backgroundColor", v)
                  }>
                  <SelectTrigger>
                    <SelectValue>
                      {(value: string | undefined) =>
                        value ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded border bg-[linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06)),linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06))] bg-size-[6px_6px] bg-position-[0_0,3px_3px] flex items-center justify-center">
                              <span
                                className="h-full w-full rounded"
                                style={{ backgroundColor: `#${value}` }}
                              />
                            </span>
                            <span>#{value}</span>
                          </span>
                        ) : null
                      }
                    </SelectValue>
                    {/* <SelectValue placeholder="Farbe wählen" /> */}
                  </SelectTrigger>
                  <SelectPopup
                    alignItemWithTrigger={false}
                    className="max-h-48 overflow-auto">
                    {BG.map((v) => (
                      <SelectItem key={v} value={v}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded border bg-[linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06)),linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06))] bg-size-[6px_6px] bg-position-[0_0,3px_3px]">
                            <div
                              className="h-full w-full rounded"
                              style={{ backgroundColor: `#${v}` }}
                            />
                          </div>
                          <div>#{v}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>
          </div>
        </DialogPanel>

        <DialogFooter>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="destructive-outline"
              className="rounded-full"
              onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleSave} className="rounded-full">
              Übernehmen
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

//  <Dialog open={open} onOpenChange={setOpen}>
//    <DialogTrigger render={<Button className="rounded-full" />}>
//      Avatar bearbeiten
//    </DialogTrigger>

//    <DialogPopup className="sm:max-w-5xl">
//      <DialogHeader>
//        <DialogTitle>Avatar bearbeiten</DialogTitle>
//        <DialogDescription>
//          Personalisiere deinen Lorelei-Avatar oder lass ihn zufällig generieren.
//        </DialogDescription>
//      </DialogHeader>

//      <DialogPanel>
//        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
//          <div className="flex flex-col items-center gap-3">
//            <Image
//              width={176}
//              height={176}
//              src={previewSrc}
//              alt="Avatar preview"
//              className="size-44"
//            />
//            <Button
//              type="button"
//              variant="outline"
//              onClick={handleRandomize}
//              className="rounded-full">
//              <Repeat2 className="me-2" />
//              Zufällig
//            </Button>
//          </div>

//          <div className="space-y-4">
//            <div className="grid gap-4 sm:grid-cols-2">
//              <AvatarSelect
//                label="Kopf"
//                value={cfg.head}
//                options={HEAD}
//                onChange={(v) => set("head", v)}
//              />
//              <AvatarSelect
//                label="Haare"
//                value={cfg.hair}
//                options={HAIR}
//                onChange={(v) => set("hair", v)}
//              />
//              <AvatarSelect
//                label="Hair Accessories"
//                value={cfg.hairAccessories}
//                options={HAIRACCESSORIES}
//                onChange={(v) => set("hairAccessories", v)}
//                allowNone
//              />
//              <AvatarSelect
//                label="Augen"
//                value={cfg.eyes}
//                options={EYES}
//                onChange={(v) => set("eyes", v)}
//              />
//              <AvatarSelect
//                label="Nase"
//                value={cfg.nose}
//                options={NOSE}
//                onChange={(v) => set("nose", v)}
//              />
//              <AvatarSelect
//                label="Mund"
//                value={cfg.mouth}
//                options={MOUTH}
//                onChange={(v) => set("mouth", v)}
//              />
//              <AvatarSelect
//                label="Sommersprossen"
//                value={cfg.freckles}
//                options={FRECKLES}
//                onChange={(v) => set("freckles", v)}
//                allowNone
//              />
//              <AvatarSelect
//                label="Brille"
//                value={cfg.glasses}
//                options={GLASSES}
//                onChange={(v) => set("glasses", v)}
//                allowNone
//              />
//              <AvatarSelect
//                label="Bart"
//                value={cfg.beard}
//                options={BEARD}
//                onChange={(v) => set("beard", v)}
//                allowNone
//                noneLabel="Keiner"
//              />
//              <AvatarSelect
//                label="Ohrringe"
//                value={cfg.earrings}
//                options={EARRINGS}
//                onChange={(v) => set("earrings", v)}
//                allowNone
//              />

//              {/* Hintergrund mit Farb-Swatch bleibt eigenständig */}
//              <Field className="gap-2 sm:col-span-2">
//                <FieldLabel>Hintergrund</FieldLabel>
//                <Select
//                  value={cfg.backgroundColor}
//                  onValueChange={(v) =>
//                    typeof v === "string" && set("backgroundColor", v)
//                  }>
//                  <SelectTrigger>
//                    <SelectValue placeholder="Farbe wählen" />
//                  </SelectTrigger>
//                  <SelectPopup>
//                    {BG.map((v) => (
//                      <SelectItem key={v} value={v}>
//                        <div className="flex items-center gap-2">
//                          <div className="h-4 w-4 rounded border bg-[linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06)),linear-gradient(45deg,rgba(0,0,0,.06)_25%,transparent_25%,transparent_75%,rgba(0,0,0,.06)_75%,rgba(0,0,0,.06))] bg-size-[6px_6px] bg-position-[0_0,3px_3px]">
//                            <div
//                              className="h-full w-full rounded"
//                              style={{ backgroundColor: `#${v}` }}
//                            />
//                          </div>
//                          <div>#{v}</div>
//                        </div>
//                      </SelectItem>
//                    ))}
//                  </SelectPopup>
//                </Select>
//              </Field>
//            </div>
//          </div>
//        </div>
//      </DialogPanel>

//      <DialogFooter>
//        <div className="flex justify-end gap-2 pt-2">
//          <Button
//            type="button"
//            variant="destructive-outline"
//            className="rounded-full"
//            onClick={() => setOpen(false)}>
//            Abbrechen
//          </Button>
//          <Button type="button" onClick={handleSave} className="rounded-full">
//            Übernehmen
//          </Button>
//        </div>
//      </DialogFooter>
//    </DialogPopup>
//  </Dialog>;
