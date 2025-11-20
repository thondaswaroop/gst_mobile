// src/services/locationService.ts
import apiClient from "../providers/api";

/**
 * PlaceItem used by your Home/BottomSheet
 * id format: "loc:<id>" or "subloc:<id>"
 */
export type PlaceItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: any;
  type?: "location" | "sublocation";
};

/**
 * Fetch a small sample list of locations + sublocations from backend and merge
 * - calls GET locations (paginated)
 * - calls GET sublocationsAll (or sublocations?locationId if you want per-location)
 *
 * Returns PlaceItem[] (top-level locations first, then their sublocations).
 *
 * Notes:
 * - your API has endpoints: action=locations (paginated) and sublocationsAll
 * - apiClient.get expects endpoint string like "locations&page=1&per=20"
 */
export async function fetchInitialPlaces(opts?: { per?: number; page?: number }) {
  const per = opts?.per ?? 30;
  const page = opts?.page ?? 1;

  try {
    // 1) fetch locations (page)
    const locRes: any = await apiClient.get(`locations&page=${page}&per=${per}`);
    const locations = (locRes && locRes.ok && Array.isArray(locRes.data?.data)) ? locRes.data.data : [];

    // 2) fetch all sublocations (we have endpoint sublocationsAll)
    const subRes: any = await apiClient.get(`sublocationsAll`);
    const sublocations = (subRes && subRes.ok && Array.isArray(subRes.data?.data)) ? subRes.data.data : [];

    // Map into PlaceItem[]
    const places: PlaceItem[] = [];

    // optional: create map of sublocations by parent
    const byParent: Record<string, any[]> = {};
    for (const s of sublocations) {
      const pid = String(s.location_id ?? s.locationId ?? "");
      if (!byParent[pid]) byParent[pid] = [];
      byParent[pid].push(s);
    }

    for (const loc of locations) {
      const lid = String(loc.id);
      places.push({
        id: `loc:${lid}`,
        title: loc.title ?? (loc.name ?? `Location ${lid}`),
        subtitle: null,
        meta: loc,
        type: "location",
      });

      const subs = byParent[lid] ?? [];
      // push a few sublocations under this location (or all)
      for (const s of subs) {
        places.push({
          id: `subloc:${String(s.id)}`,
          title: s.title ?? (s.name ?? `Subloc ${s.id}`),
          subtitle: loc.title ?? null,
          meta: s,
          type: "sublocation",
        });
      }
    }

    // if no locations returned, try fallback: convert all sublocations into items
    if (places.length === 0 && sublocations.length > 0) {
      for (const s of sublocations.slice(0, per)) {
        places.push({
          id: `subloc:${String(s.id)}`,
          title: s.title ?? s.name ?? `Subloc ${s.id}`,
          subtitle: s.location_title ?? null,
          meta: s,
          type: "sublocation",
        });
      }
    }

    return places;
  } catch (err) {
    console.warn("fetchInitialPlaces error", err);
    // return empty array on error (UI will show fallback)
    return [];
  }
}
