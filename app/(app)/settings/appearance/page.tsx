import { CheckIcon, MinusIcon } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const items = [
  { image: "https://coss.com/origin/ui-light.png", label: "Light", value: "1" },
  { image: "https://coss.com/origin/ui-dark.png", label: "Dark", value: "2" },
  {
    image: "https://coss.com/origin/ui-system.png",
    label: "System",
    value: "3",
  },
];

export default function Page() {
  return (
    <div className="sm:p-10 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Erscheinungsbild</h1>
      <p className="text-muted-foreground">
        Passe das Erscheinungsbild von Routine an deine Vorlieben an
      </p>

      <div className="mt-8">
        <fieldset className="space-y-4">
          <legend className="font-medium text-foreground text-sm leading-none">
            Wähle ein Thema
          </legend>
          <RadioGroup className="flex gap-3 flex-row" defaultValue="1">
            {items.map((item) => (
              <label key={`label-${item.value}`}>
                <RadioGroupItem
                  className="peer sr-only after:absolute after:inset-0"
                  id={`label-${item.value}`}
                  value={item.value}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.label}
                  className="relative cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none transition-[color,box-shadow] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent peer-data-disabled:opacity-50"
                  height={70}
                  src={item.image}
                  width={88}
                />
                <span className="group mt-2 flex items-center gap-1 peer-data-[state=unchecked]:text-muted-foreground/70">
                  <CheckIcon
                    aria-hidden="true"
                    className="group-peer-data-[state=unchecked]:hidden"
                    size={16}
                  />
                  <MinusIcon
                    aria-hidden="true"
                    className="group-peer-data-[state=checked]:hidden"
                    size={16}
                  />
                  <span className="font-medium text-xs">{item.label}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      </div>
    </div>
  );
}
