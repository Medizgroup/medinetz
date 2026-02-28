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
import { Repeat2 } from "lucide-react";

// Lorelei values (aus den DiceBear Lorelei Docs)
const EYES = Array.from(
  { length: 24 },
  (_, i) => `variant${String(i + 1).padStart(2, "0")}`,
);

const FRECKLES = ["variant01"] as const;

const MOUTH = [
  "happy01",
  "happy02",
  "happy03",
  "happy04",
  "happy05",
  "happy06",
  "happy07",
  "happy08",
  "happy09",
  "happy10",
  "happy11",
  "happy12",
  "happy13",
  "happy14",
  "happy15",
  "happy16",
  "happy17",
  "happy18",
  "sad01",
  "sad02",
  "sad03",
  "sad04",
  "sad05",
  "sad06",
  "sad07",
  "sad08",
  "sad09",
] as const;

const GLASSES = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
] as const;

const BEARD = ["variant01", "variant02"] as const;
const EARRINGS = ["variant01", "variant02", "variant03"] as const;

const HAIR = Array.from(
  { length: 48 },
  (_, i) => `variant${String(i + 1).padStart(2, "0")}`,
);

const NOSE = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
  "variant06",
] as const;
const HEAD = ["variant01", "variant02", "variant03", "variant04"] as const;

// WICHTIG: Lorelei hairAccessories = flowers (nicht variant01)
const HAIRACCESSORIES = ["flowers"] as const;

const BG = [
  "ffffff",
  "f5f5f5",
  "0a0a0a",
  "dc2626",
  "f97316",
  "d97706",
  "ca8a04",
  "65a30d",
  "16a34a",
  "059669",
  "0d9488",
  "0891b2",
  "0284c7",
  "2563eb",
  "4f46e5",
  "7c3aed",
  "9333ea",
  "c026d3",
  "db2777",
  "e11d48",
] as const;

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pick<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function LoreleiAvatarDialog(props: {
  seed: string;
  value?: string | null;
  onPick: (avatarUrl: string) => void;
}) {
  const { seed, onPick } = props;

  const [open, setOpen] = React.useState(false);

  const [bg, setBg] = React.useState<(typeof BG)[number]>(BG[0]);

  const [head, setHead] = React.useState<(typeof HEAD)[number]>(HEAD[0]);
  const [hair, setHair] = React.useState<string>(HAIR[0]);
  const [hairAccessories, setHairAccessories] = React.useState<string>("none");

  const [eyes, setEyes] = React.useState<string>(EYES[0]);
  const [nose, setNose] = React.useState<(typeof NOSE)[number]>(NOSE[0]);
  const [mouth, setMouth] = React.useState<(typeof MOUTH)[number]>(MOUTH[0]);

  const [freckles, setFreckles] = React.useState<string>("none");
  const [glasses, setGlasses] = React.useState<string>("none");
  const [beard, setBeard] = React.useState<string>("none");
  const [earrings, setEarrings] = React.useState<string>("none");

  const options = React.useMemo(() => {
    const base: Record<string, unknown> = {
      seed,
      size: 128,
      radius: 20,
      backgroundColor: [bg],

      head: [head],
      hair: [hair],
      eyes: [eyes],
      nose: [nose],
      mouth: [mouth],
    };

    // Hair Accessories
    if (hairAccessories !== "none") {
      base.hairAccessories = [hairAccessories]; // z.B. ["flowers"]
      base.hairAccessoriesProbability = 100;
    } else {
      base.hairAccessoriesProbability = 0;
    }

    // Freckles
    if (freckles !== "none") {
      base.freckles = [freckles];
      base.frecklesProbability = 100;
    } else {
      base.frecklesProbability = 0;
    }

    // Glasses
    if (glasses !== "none") {
      base.glasses = [glasses];
      base.glassesProbability = 100;
    } else {
      base.glassesProbability = 0;
    }

    // Beard
    if (beard !== "none") {
      base.beard = [beard];
      base.beardProbability = 100;
    } else {
      base.beardProbability = 0;
    }

    // Earrings
    if (earrings !== "none") {
      base.earrings = [earrings];
      base.earringsProbability = 100;
    } else {
      base.earringsProbability = 0;
    }

    return base;
  }, [
    seed,
    bg,
    head,
    hair,
    hairAccessories,
    eyes,
    nose,
    mouth,
    freckles,
    glasses,
    beard,
    earrings,
  ]);

  const svg = React.useMemo(() => {
    return createAvatar(lorelei, options).toString();
  }, [options]);

  const previewSrc = React.useMemo(() => svgToDataUri(svg), [svg]);

  const handleSave = () => {
    onPick(previewSrc);
    setOpen(false);
  };

  const handleRandomize = () => {
    setBg(pick(BG));
    setHead(pick(HEAD));
    setHair(pick(HAIR));
    setEyes(pick(EYES));
    setNose(pick(NOSE));
    setMouth(pick(MOUTH));

    setHairAccessories(Math.random() > 0.75 ? pick(HAIRACCESSORIES) : "none");
    setFreckles(Math.random() > 0.7 ? pick(FRECKLES) : "none");
    setGlasses(Math.random() > 0.6 ? pick(GLASSES) : "none");
    setBeard(Math.random() > 0.8 ? pick(BEARD) : "none");
    setEarrings(Math.random() > 0.8 ? pick(EARRINGS) : "none");
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
            Personalisierte dein lorelei Avatar oder lass es zufällig
            generieren.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="Avatar preview" className="size-44 " />
              <Button
                type="button"
                variant="outline"
                onClick={handleRandomize}
                className="rounded-full">
                <Repeat2 className="me-2" />
                Zufällig
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="gap-2">
                  <FieldLabel>Kopf</FieldLabel>
                  <Select
                    value={head}
                    onValueChange={(v) => {
                      if (typeof v === "string") {
                        setHead(v as typeof head);
                      }
                    }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kopf wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      {HEAD.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Haare</FieldLabel>
                  <Select
                    value={hair}
                    onValueChange={(v) => typeof v === "string" && setHair(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Haare wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      {HAIR.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Hair Accessories</FieldLabel>
                  <Select
                    value={hairAccessories}
                    onValueChange={(v) =>
                      typeof v === "string" && setHairAccessories(v)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Accessory wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="none">Keine</SelectItem>
                      {HAIRACCESSORIES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Augen</FieldLabel>
                  <Select
                    value={eyes}
                    onValueChange={(v) => typeof v === "string" && setEyes(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Augen wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      {EYES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Nase</FieldLabel>
                  <Select
                    value={nose}
                    onValueChange={(v) => typeof v === "string" && setNose(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nase wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      {NOSE.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Mund</FieldLabel>
                  <Select
                    value={mouth}
                    onValueChange={(v) => typeof v === "string" && setMouth(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mund wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      {MOUTH.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Sommersprossen</FieldLabel>
                  <Select
                    value={freckles}
                    onValueChange={(v) =>
                      typeof v === "string" && setFreckles(v)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Freckles wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="none">Keine</SelectItem>
                      {FRECKLES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Brille</FieldLabel>
                  <Select
                    value={glasses}
                    onValueChange={(v) =>
                      typeof v === "string" && setGlasses(v)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Brille wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="none">Keine</SelectItem>
                      {GLASSES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Bart</FieldLabel>
                  <Select
                    value={beard}
                    onValueChange={(v) => typeof v === "string" && setBeard(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bart wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="none">Keiner</SelectItem>
                      {BEARD.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2">
                  <FieldLabel>Ohrringe</FieldLabel>
                  <Select
                    value={earrings}
                    onValueChange={(v) =>
                      typeof v === "string" && setEarrings(v)
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Ohrringe wählen" />
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="none">Keine</SelectItem>
                      {EARRINGS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field className="gap-2 sm:col-span-2">
                  <FieldLabel>Hintergrund</FieldLabel>
                  <Select
                    value={bg}
                    onValueChange={(v) => typeof v === "string" && setBg(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Farbe wählen" />
                    </SelectTrigger>
                    <SelectPopup>
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
              Speichern
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
