// src/providers/placesService.ts
import apiClient from './api';
import type { CancelTokenSource } from 'axios';

export type PlaceItem = {
  id: string; // e.g. "loc-12" | "subloc-501"
  type: 'location' | 'sublocation';
  title: string;
  subtitle?: string | null; // parent location for sublocation
  meta?: any; // original server meta (ids, lat/lng, etc)
};

/**
 * Wrapper to call server-side searchPlaces endpoint.
 * Returns { page, per, data: PlaceItem[] }
 */
export async function searchPlacesServer(q: string, page = 1, per = 20, include_sublocations = 1, cancelToken?: CancelTokenSource) {
  const qs = `searchPlaces&q=${encodeURIComponent(q)}&page=${page}&limit=${per}&include_sublocations=${include_sublocations}`;
  const res = await apiClient.get(qs, cancelToken ? { cancelToken: cancelToken.token } : undefined);
  if (!res.ok) throw new Error(res.error || 'Search failed');
  // expect res.data = { status:true, page, per, data: [...] }
  return res.data as { status: true; page: number; per: number; data: PlaceItem[] };
}
