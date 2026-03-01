import type { LoreleiConfig } from "@/lib/types/avatar";

export function buildLoreleiUrl(seed: string, c: LoreleiConfig) {
  const url = new URL("https://api.dicebear.com/9.x/lorelei/svg");
  url.searchParams.set("seed", seed);

  url.searchParams.set("backgroundColor", c.bg);

  url.searchParams.set("head", c.head);
  url.searchParams.set("hair", c.hair);
  url.searchParams.set("eyes", c.eyes);
  url.searchParams.set("nose", c.nose);
  url.searchParams.set("mouth", c.mouth);

  if (c.hairAccessories !== "none") {
    url.searchParams.set("hairAccessories", c.hairAccessories); // flowers
    url.searchParams.set("hairAccessoriesProbability", "100");
  } else {
    url.searchParams.set("hairAccessoriesProbability", "0");
  }

  if (c.freckles !== "none") {
    url.searchParams.set("freckles", c.freckles);
    url.searchParams.set("frecklesProbability", "100");
  } else {
    url.searchParams.set("frecklesProbability", "0");
  }

  if (c.glasses !== "none") {
    url.searchParams.set("glasses", c.glasses);
    url.searchParams.set("glassesProbability", "100");
  } else {
    url.searchParams.set("glassesProbability", "0");
  }

  if (c.beard !== "none") {
    url.searchParams.set("beard", c.beard);
    url.searchParams.set("beardProbability", "100");
  } else {
    url.searchParams.set("beardProbability", "0");
  }

  if (c.earrings !== "none") {
    url.searchParams.set("earrings", c.earrings);
    url.searchParams.set("earringsProbability", "100");
  } else {
    url.searchParams.set("earringsProbability", "0");
  }

  return url.toString();
}
