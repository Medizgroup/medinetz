type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

/**
 * Geokodiert eine Adresse via OpenStreetMap Nominatim.
 * Fair-use Limit: max 1 req/sec — wir cachen daher in-memory.
 */
const cache = new Map<string, GeocodeResult | null>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const cacheTimestamps = new Map<string, number>();

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const key = trimmed.toLowerCase();
  const cached = cache.get(key);
  const ts = cacheTimestamps.get(key);
  if (cached !== undefined && ts && Date.now() - ts < CACHE_TTL) {
    return cached;
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "de,at,ch"); // DACH-Region
    url.searchParams.set("addressdetails", "0");

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim Usage Policy: User-Agent mit Kontakt erforderlich
        "User-Agent": "Medinetz-Coordination/1.0 (https://medizgroup.de)",
        Accept: "application/json",
      },
      // Hard-Timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      cache.set(key, null);
      cacheTimestamps.set(key, Date.now());
      return null;
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (!data?.length) {
      cache.set(key, null);
      cacheTimestamps.set(key, Date.now());
      return null;
    }

    const first = data[0];
    const result: GeocodeResult = {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      displayName: first.display_name,
    };

    cache.set(key, result);
    cacheTimestamps.set(key, Date.now());
    return result;
  } catch {
    return null;
  }
}
