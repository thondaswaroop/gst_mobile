// src/utils/helper.ts
import { PlaceItem } from "../components/LocationSearchModal";
import { common } from "../constants/common";
import apiClient from "../providers/api";

export type ResolvedSubloc = { sublocation_id?: number; lat?: number | null; lng?: number | null; meta?: any } | null;

/** helpers */
export const extractNumericId = (idStr: any) => {
  if (!idStr) return null;
  const s = String(idStr);
  const m = s.match(/(\d+)$/);
  if (m) return Number(m[1]);
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
};

export const readLatLngFromItem = (p: any) => {
  if (!p) return { lat: null as number | null, lng: null as number | null };
  const r = p as any;
  const meta = r.meta ?? {};
  const latCandidates = [r.lat, r.latitude, r.lat_str, meta.lat, meta.latitude, meta.lat_str];
  const lngCandidates = [r.lng, r.longitude, r.lng_str, meta.lng, meta.longitude, meta.lng_str];
  const lat = latCandidates.find((v) => v !== undefined && v !== null && v !== '') ?? null;
  const lng = lngCandidates.find((v) => v !== undefined && v !== null && v !== '') ?? null;
  return {
    lat: lat !== null ? Number(lat) : null,
    lng: lng !== null ? Number(lng) : null,
  };
};

/** haversine distance (km) */
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

/**
 * Resolve a PlaceItem into { sublocation_id, lat, lng, meta }.
 * Uses only `searchPlaces&include_sublocations=1` (server-supported).
 */
export const resolveSublocation = async (p: PlaceItem | null): Promise<ResolvedSubloc> => {
  if (!p) return null;
  if (common.DEBUG) console.log("resolveSublocation input:", p);

  const meta = p.meta ?? {};

  // 1) direct known sublocation id from meta or id prefix
  const quick = meta.sublocation_id ?? meta.sublocationId ?? (p.type === "sublocation" ? (function(){ const m = String(p.id||''); const mm = m.match(/(\d+)$/); return mm ? Number(mm[1]) : null; })() : null);
  if (quick && Number.isFinite(Number(quick))) {
    const latlng = readLatLngFromItem(p);
    if (common.DEBUG) console.log("resolveSublocation: quick match ->", quick, latlng);
    return { sublocation_id: Number(quick), lat: latlng.lat, lng: latlng.lng, meta: meta };
  }

  // read lat/lng if available from item
  const { lat: itemLat, lng: itemLng } = readLatLngFromItem(p);

  // Build a search query that will likely return the place + its sublocations.
  // Prefer using id-like string (loc-12 / subloc-45) if present, else title.
  const qCandidates = [
    typeof p.id === "string" ? p.id : null,
    p.title || null,
  ].filter(Boolean) as string[];

  // helper to call searchPlaces with include_sublocations and limit
  const callSearchPlaces = async (q: string, limit = 8) => {
    try {
      const res: any = await apiClient.get(`searchPlaces&include_sublocations=1&q=${encodeURIComponent(q)}&limit=${limit}`);
      if (res && res.ok) {
        const dataArr: any[] = Array.isArray((res.data as any).data) ? (res.data as any).data : (Array.isArray(res.data) ? res.data : (Array.isArray((res.data as any).results) ? (res.data as any).results : []));
        return dataArr;
      }
    } catch (err) {
      if (common.DEBUG) console.warn("searchPlaces failed:", err);
    }
    return [];
  };

  // Try searchPlaces with candidates
  for (const q of qCandidates) {
    if (!q) continue;
    const arr = await callSearchPlaces(q, 12);
    if (!arr || arr.length === 0) continue;

    // map results to uniform objects and prefer:
    // 1) exact id match
    // 2) any item with type sublocation
    // 3) nearest sublocation if we have coordinates
    // Normalize lat/lng and id for each server row
    const mapped = arr.map((r: any) => {
      const rid = r?.id ?? r?.sublocation_id ?? r?.location_id ?? (r?.meta && (r.meta.id ?? r.meta.sublocation_id ?? r.meta.location_id)) ?? null;
      const lat = r?.lat ?? r?.latitude ?? r?.meta?.lat ?? r?.meta?.latitude ?? null;
      const lng = r?.lng ?? r?.longitude ?? r?.meta?.lng ?? r?.meta?.longitude ?? null;
      const type = (r?.type ?? "").toString().toLowerCase().includes("subloc") || String(rid).toLowerCase().startsWith("subloc-") || Boolean(r?.location_id || r?.locationId || (r?.meta && (r.meta.location_id ?? r.meta.locationId))) ? "sublocation" : "location";
      return { raw: r, id: rid, lat: lat !== null ? Number(lat) : null, lng: lng !== null ? Number(lng) : null, type };
    });

    // 1) exact id match (prefer sublocation)
    const exact = mapped.find(m => String(m.id) === String(p.id) || String(m.id) === String(meta.id));
    if (exact) {
      if (common.DEBUG) console.log("resolveSublocation: exact found", exact);
      if (exact.type === "sublocation") return { sublocation_id: extractNumericId(exact.id), lat: exact.lat, lng: exact.lng, meta: exact.raw };
      // if exact is a location, later we'll try to pick a sublocation from results below
    }

    // 2) prefer any sublocation result
    const subLocs = mapped.filter(m => m.type === "sublocation");
    if (subLocs.length > 0) {
      if (itemLat !== null && itemLng !== null) {
        // pick nearest sublocation by haversine to the selected item's coordinates
        let best = subLocs[0];
        let bestDist = (best.lat !== null && best.lng !== null) ? haversineKm(itemLat, itemLng, best.lat, best.lng) : Number.POSITIVE_INFINITY;
        for (let i = 1; i < subLocs.length; i++) {
          const s = subLocs[i];
          if (s.lat === null || s.lng === null) continue;
          const d = haversineKm(itemLat, itemLng, s.lat, s.lng);
          if (d < bestDist) { best = s; bestDist = d; }
        }
        if (common.DEBUG) console.log("resolveSublocation: chosen nearest sublocation", best, "distKm:", bestDist);
        return { sublocation_id: extractNumericId(best.id), lat: best.lat, lng: best.lng, meta: best.raw };
      } else {
        // no coords — just take the first sublocation
        const s = subLocs[0];
        if (common.DEBUG) console.log("resolveSublocation: chosen first sublocation", s);
        return { sublocation_id: extractNumericId(s.id), lat: s.lat, lng: s.lng, meta: s.raw };
      }
    }

    // 3) no explicit sublocations returned — attempt to pick a sublocation-like object (rows may embed subloc under meta)
    // Some servers may return location rows with appended sublocations elsewhere; try to scan raw fields for nested sublocations
    for (const m of mapped) {
      const raw = m.raw;
      if (!raw) continue;
      // try to find nested list of sublocations
      const nested = raw.sublocations ?? raw.children ?? raw._sublocs ?? null;
      if (Array.isArray(nested) && nested.length > 0) {
        const s = nested[0];
        const sid = s?.id ?? s?.sublocation_id ?? s?.meta?.id ?? null;
        const slat = s?.lat ?? s?.latitude ?? s?.meta?.lat ?? null;
        const slng = s?.lng ?? s?.longitude ?? s?.meta?.lng ?? null;
        if (sid) {
          if (common.DEBUG) console.log("resolveSublocation: nested sublocation from raw", sid);
          return { sublocation_id: extractNumericId(sid), lat: slat ?? null, lng: slng ?? null, meta: s };
        }
      }
    }
    // if we reached here for this q candidate, continue to next q candidate
  }

  // Final fallback: try calling searchPlaces with the title (if not already), and pick first sublocation
  try {
    const fallbackQ = (p.title ?? (p.id ? String(p.id) : "") ) || "";
    if (fallbackQ) {
      const arr = await callSearchPlaces(fallbackQ, 20);
      if (arr && arr.length > 0) {
        const mapped = arr.map((r: any) => {
          const rid = r?.id ?? r?.sublocation_id ?? r?.location_id ?? (r?.meta && (r.meta.id ?? r.meta.sublocation_id ?? r.meta.location_id)) ?? null;
          const lat = r?.lat ?? r?.latitude ?? r?.meta?.lat ?? r?.meta?.latitude ?? null;
          const lng = r?.lng ?? r?.longitude ?? r?.meta?.lng ?? r?.meta?.longitude ?? null;
          const type = (r?.type ?? "").toString().toLowerCase().includes("subloc") ? "sublocation" : "location";
          return { raw: r, id: rid, lat: lat !== null ? Number(lat) : null, lng: lng !== null ? Number(lng) : null, type };
        });
        const sub = mapped.find(m => m.type === "sublocation") ?? mapped[0];
        if (sub) {
          if (common.DEBUG) console.log("resolveSublocation: fallback chose", sub);
          return { sublocation_id: extractNumericId(sub.id), lat: sub.lat, lng: sub.lng, meta: sub.raw };
        }
      }
    }
  } catch (e) {
    if (common.DEBUG) console.warn("final fallback searchPlaces failed:", e);
  }

  // nothing found
  if (common.DEBUG) console.log("resolveSublocation: nothing found for", p);
  return null;
};
