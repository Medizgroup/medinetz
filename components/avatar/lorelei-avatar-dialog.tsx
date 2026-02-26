"use client";

import * as React from "react";
import { createAvatar } from "@dicebear/core";
import { loreleiNeutral } from "@dicebear/collection";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type LoreleiOptions = {
  backgroundColor?: string[];
  eyes?: string[];
  mouth?: string[];
  glasses?: string[];
  seed?: string;
};

const EYES = ["variant01", "variant02", "variant03", "variant04", "variant05"];
const MOUTH = ["happy01", "happy02", "happy03", "sad01", "sad02", "sad03"];
const GLASSES = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
];
const BG = ["ffffff", "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"];

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function LoreleiAvatarDialog(props: {
  seed: string; // z.B. userId oder email
  value?: string | null; // bestehende avatarUrl
  onPick: (avatarUrl: string) => void;
}) {
  const { seed, onPick } = props;

  const [open, setOpen] = React.useState(false);

  const [eyes, setEyes] = React.useState(EYES[0]);
  const [mouth, setMouth] = React.useState(MOUTH[0]);
  const [glasses, setGlasses] = React.useState<string>("none");
  const [bg, setBg] = React.useState(BG[0]);

  const options: LoreleiOptions = React.useMemo(() => {
    const base: LoreleiOptions = {
      seed,
      backgroundColor: [bg],
      eyes: [eyes],
      mouth: [mouth],
    };

    if (glasses !== "none") base.glasses = [glasses];
    return base;
  }, [seed, bg, eyes, mouth, glasses]);

  const svg = React.useMemo(() => {
    // DiceBear JS usage: createAvatar(loreleiNeutral, options) :contentReference[oaicite:2]{index=2}
    return createAvatar(loreleiNeutral, {
      // ein paar sinnvolle Defaults
      size: 128,
      radius: 20,
      ...options,
    }).toString();
  }, [options]);

  const previewSrc = React.useMemo(() => svgToDataUri(svg), [svg]);

  const handleSave = () => {
    // Du kannst entweder:
    // A) das SVG als data-uri speichern (so wie hier) (funktioniert offline),
    // B) oder eine DiceBear API URL speichern.
    const avatarUrl = previewSrc;
    onPick(avatarUrl);
    setOpen(false);
  };

  const handleRandomize = () => {
    setEyes(EYES[Math.floor(Math.random() * EYES.length)]);
    setMOUTHsafe(setMouth);
    setGlasses(
      Math.random() > 0.6
        ? GLASSES[Math.floor(Math.random() * GLASSES.length)]
        : "none",
    );
    setBg(BG[Math.floor(Math.random() * BG.length)]);
  };

  function setMOUTHsafe(fn: (v: string) => void) {
    fn(MOUTH[Math.floor(Math.random() * MOUTH.length)]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button type="button" variant="outline" className="whitespace-nowrap">
          Avatar bearbeiten
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Lorelei Avatar</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="Avatar preview"
              className="size-40 rounded-2xl border"
            />
            <Button type="button" variant="secondary" onClick={handleRandomize}>
              Zufällig
            </Button>
          </div>

          <div className="space-y-4">
            <Field className="gap-2">
              <FieldLabel>Augen</FieldLabel>
              <Select
                value={eyes}
                onValueChange={(value) => {
                  if (value !== null) setEyes(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Augen wählen" />
                </SelectTrigger>
                <SelectContent>
                  {EYES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="gap-2">
              <FieldLabel>Mund</FieldLabel>
              <Select
                value={mouth}
                onValueChange={(value) => {
                  if (value !== null) setMouth(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Mund wählen" />
                </SelectTrigger>
                <SelectContent>
                  {MOUTH.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="gap-2">
              <FieldLabel>Brille</FieldLabel>
              <Select
                value={glasses}
                onValueChange={(value) => {
                  if (value !== null) setGlasses(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Brille wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  {GLASSES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Du kannst dein Avatar ändern oder löschen.
              </FieldDescription>
            </Field>

            <Field className="gap-2">
              <FieldLabel>Hintergrund</FieldLabel>
              <Select
                value={bg}
                onValueChange={(value) => {
                  if (value !== null) setBg(value);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Farbe wählen" />
                </SelectTrigger>
                <SelectContent>
                  {BG.map((v) => (
                    <SelectItem key={v} value={v}>
                      #{v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button type="button" onClick={handleSave}>
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
