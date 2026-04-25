"use client";

import { Radio, RadioGroup } from "@/components/ui/radio-group";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const items = [
  { image: "/ui-light.png", label: "Light", value: "light" },
  { image: "/ui-dark.png", label: "Dark", value: "dark" },
  {
    image: "/ui-system.png",
    label: "System",
    value: "system",
  },
];

export default function Page() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!theme) return null;
  return (
    <div className="sm:p-10 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Erscheinungsbild</h1>
      <p className="text-muted-foreground">
        Passe das Erscheinungsbild der Platform an deine Vorlieben an
      </p>

      <RadioGroup
        value={theme}
        className="mt-8 flex  flex-row"
        onValueChange={(value) => setTheme(value)}>
        {items.map((item) => (
          <div key={item.value} className="flex flex-col items-center gap-2">
            <Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
              <Radio
                value={item.value}
                className="peer sr-only after:absolute after:inset-0 hidden"
              />
              <Image
                src={item.image}
                alt={`${item.label} theme preview`}
                width={88}
                height={70}
                className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none"
              />
            </Label>
            <div className="flex flex-row gap-6 items-center justify-center">
              <p>{item.label}</p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
