// src/components/LocationSearchModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Modal,
  Animated,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  ScrollView,
} from "react-native";
import colors from "../constants/colors";
import apiClient from "../providers/api";

export type PlaceItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: any;
  type?: "location" | "sublocation";
};

interface Props {
  visible: boolean;
  onRequestClose: () => void;
  onSelect: (item: PlaceItem) => void;
  maxResults?: number;
}

/** Debounce helper */
const useDebounced = (value: string, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/** Normalize whatever shape server returns into PlaceItem.
 * Ensures meta contains lat/lng when available (top-level or inside nested meta).
 */
const normalize = (r: any, idx = 0): PlaceItem => {
  // gather id candidates
  const rawId =
    r?.id ??
    r?.sublocation_id ??
    r?.location_id ??
    (r?.meta && (r.meta.id ?? r.meta.sublocation_id ?? r.meta.location_id)) ??
    idx;
  const id = String(rawId);

  // decide type: sublocation if type contains subloc or id starts with subloc- or object has location_id
  const typeLower = (r?.type ?? "").toString().toLowerCase();
  const looksSubloc =
    typeLower.includes("subloc") ||
    id.startsWith("subloc-") ||
    Boolean(r?.location_id || r?.locationId || (r?.meta && (r.meta.location_id ?? r.meta.locationId)));
  const type: "location" | "sublocation" = looksSubloc ? "sublocation" : "location";

  const title = String(
    r?.title ?? r?.name ?? r?.place ?? (type === "sublocation" ? `Point ${id}` : `City ${id}`)
  );
  const subtitle = (r?.subtitle ?? r?.location_title ?? r?.parent_title ?? r?.city ?? "") || undefined;

  // meta (include popular if present)
  const metaFromServer = r?.meta && typeof r.meta === "object" ? { ...r.meta } : {};
  const latTop = r?.lat ?? r?.latitude ?? r?.lat_str ?? null;
  const lngTop = r?.lng ?? r?.longitude ?? r?.lng_str ?? null;
  const latNested = metaFromServer?.lat ?? metaFromServer?.latitude ?? null;
  const lngNested = metaFromServer?.lng ?? metaFromServer?.longitude ?? null;
  const lat = latTop ?? latNested ?? null;
  const lng = lngTop ?? lngNested ?? null;

  const meta: any = {
    _raw: r,
    id: metaFromServer?.id ?? r?.id ?? r?.sublocation_id ?? r?.location_id ?? null,
    location_id: metaFromServer?.location_id ?? metaFromServer?.locationId ?? r?.location_id ?? null,
  };
  if (lat !== null) meta.lat = lat;
  if (lng !== null) meta.lng = lng;

  // pull popular flag (server may set r.popular or meta.popular)
  const popular = (metaFromServer?.popular ?? r?.popular) ?? null;
  if (popular !== null) {
    // normalize to number 0/1 or boolean
    meta.popular = (popular === 1 || popular === "1" || popular === true || String(popular).toLowerCase() === "true") ? 1 : 0;
  }

  return { id, title, subtitle, meta, type };
};

const LocationSearchModal: React.FC<Props> = ({
  visible,
  onRequestClose,
  onSelect,
  maxResults = 200,
}) => {
  const [query, setQuery] = useState("");
  const debQuery = useDebounced(query, 350);
  const [itemsRaw, setItemsRaw] = useState<PlaceItem[]>([]);
  const [itemsGrouped, setItemsGrouped] = useState<PlaceItem[]>([]);
  const [populars, setPopulars] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const anim = useRef(new Animated.Value(0)).current; // 0 hidden → 1 visible

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // initial load without q (server returns popular / fallback)
      fetchPlaces("");
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
      setQuery("");
      setItemsRaw([]);
      setPopulars([]);
      setItemsGrouped([]);
      setError(null);
    }
  }, [visible]);

  /** Fetch data (with or without query). Always request include_sublocations=1 */
  const fetchPlaces = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const qParam = q ? `&q=${encodeURIComponent(q)}` : "";
      const res: any = await apiClient.get(`searchPlaces&include_sublocations=1${qParam}`);

      let dataArr: any[] = [];
      if (res && res.ok) {
        // support multiple shapes
        if (Array.isArray((res.data as any).data)) dataArr = (res.data as any).data;
        else if (Array.isArray(res.data)) dataArr = res.data;
        else if (Array.isArray((res.data as any).results)) dataArr = (res.data as any).results;
      }

      // If server returned nothing while there's a query, fallback to sublocationsAll to surface sublocations client-side.
      if (q && dataArr.length === 0) {
        try {
          const sAll = await apiClient.get("sublocationsAll");
          if (sAll && sAll.ok) {
            const arr = Array.isArray((sAll.data as any).data) ? (sAll.data as any).data : Array.isArray(sAll.data) ? sAll.data : [];
            const lower = q.toLowerCase();
            const filtered = arr.filter((r: any) => {
              const title = String(r?.title ?? r?.name ?? "");
              const locTitle = String(r?.location_title ?? r?.parent_title ?? "");
              return title.toLowerCase().includes(lower) || locTitle.toLowerCase().includes(lower);
            });
            if (filtered.length > 0) dataArr = filtered;
          }
        } catch {
          // ignore fallback error
        }
      }

      const mapped: PlaceItem[] = (dataArr || []).map((r: any, idx: number) => normalize(r, idx));
      const limited = mapped.slice(0, maxResults);
      setItemsRaw(limited);

      // build popular list + grouped list
      buildPresentationLists(limited);
    } catch (err: any) {
      console.warn("LocationSearchModal fetch error:", err);
      setError("Failed to load locations");
      setItemsRaw([]);
      setPopulars([]);
      setItemsGrouped([]);
    } finally {
      setLoading(false);
    }
  };

  /** Build grouped presentation:
   *  - populars: array of location items with meta.popular==1 (unique)
   *  - itemsGrouped: array where each non-popular location is followed by its sublocations (indented)
   *  - standalone sublocations (not attached to any returned location) are included at the end as plain items
   */
  const buildPresentationLists = (arr: PlaceItem[]) => {
    const locMap: Record<string, PlaceItem> = {};
    const subsByLoc: Record<string, PlaceItem[]> = {};
    const standaloneSublocs: PlaceItem[] = [];

    // first pass: collect locations and sublocations
    arr.forEach((it) => {
      if (it.type === "location") {
        const key = String(it.meta?.id ?? it.id);
        locMap[key] = it;
      }
    });
    arr.forEach((it) => {
      if (it.type === "sublocation") {
        const lid = it.meta?.location_id ?? it.meta?.locationId ?? null;
        if (lid && String(lid) in locMap) {
          const key = String(lid);
          subsByLoc[key] = subsByLoc[key] ?? [];
          subsByLoc[key].push(it);
        } else {
          // maybe the server returned a sublocation where parent is present but in different id form
          // try to match by subtitle == location title if possible
          let matched = false;
          if (it.meta && it.meta.location_id == null && it.subtitle) {
            for (const k of Object.keys(locMap)) {
              if (String(locMap[k].title).toLowerCase() === String(it.subtitle).toLowerCase()) {
                subsByLoc[k] = subsByLoc[k] ?? [];
                subsByLoc[k].push(it);
                matched = true;
                break;
              }
            }
          }
          if (!matched) standaloneSublocs.push(it);
        }
      }
    });

    // popular locations list (unique, preserve order as found)
    const popularList: PlaceItem[] = [];
    const usedLocs = new Set<string>();
    arr.forEach((it) => {
      if (it.type === "location" && it.meta && (it.meta.popular === 1 || it.meta.popular === "1")) {
        const key = String(it.meta?.id ?? it.id);
        if (!usedLocs.has(key)) {
          popularList.push(it);
          usedLocs.add(key);
        }
      }
    });

    // build grouped list: non-popular locations first (in original order), each followed by its sublocations (indented)
    const grouped: PlaceItem[] = [];
    const addedLocs = new Set<string>();
    arr.forEach((it) => {
      if (it.type === "location") {
        const key = String(it.meta?.id ?? it.id);
        // skip if it's a popular location (we show populars separately)
        if (it.meta && it.meta.popular === 1) return;
        if (addedLocs.has(key)) return;
        grouped.push(it);
        addedLocs.add(key);
        // append sublocations
        const subs = subsByLoc[key] ?? [];
        subs.forEach((s) => {
          // mark sub item with a flag used for indentation in render
          grouped.push({ ...s, meta: { ...s.meta, _groupedUnder: key } });
        });
      }
    });

    // append standalone sublocations (not attached to any shown location)
    standaloneSublocs.forEach((s) => grouped.push(s));

    setPopulars(popularList);
    setItemsGrouped(grouped);
  };

  /** On typing */
  useEffect(() => {
    if (!visible) return;
    fetchPlaces(debQuery.trim());
  }, [debQuery, visible]);

  /** Item selection */
  const handleSelect = (it: PlaceItem) => {
    setSelectedId(it.id);
    setTimeout(() => {
      Keyboard.dismiss();
      onSelect(it);
    }, 120);
  };

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  /** Small UI components */
  const renderPopularChip = (p: PlaceItem) => (
    <TouchableOpacity key={p.id} style={styles.chip} activeOpacity={0.85} onPress={() => handleSelect(p)}>
      <Text style={styles.chipText}>{p.title}</Text>
    </TouchableOpacity>
  );

  const renderRow = ({ item }: { item: PlaceItem }) => {
    const isSubloc = item.type === "sublocation";
    const groupedUnder = item.meta?._groupedUnder;
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={[styles.item, isSubloc ? styles.sublocItem : undefined, groupedUnder ? styles.sublocGrouped : undefined]}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, isSubloc ? styles.itemTitleSubloc : undefined]}>{item.title}</Text>
          {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
        </View>
        {isSubloc ? <Text style={styles.itemTag}>Board at</Text> : <Text style={styles.cityTag}>City</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onRequestClose();
          }}
        />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search your chosen location"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                style={styles.input}
                autoFocus
                clearButtonMode="while-editing"
              />
              {loading ? <ActivityIndicator style={{ marginLeft: 8 }} color={colors.primary} size="small" /> : null}
            </View>
            <TouchableOpacity onPress={onRequestClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Popular strip */}
          {(!debQuery || debQuery.trim() === "") && populars && populars.length > 0 ? (
            <View style={styles.popularWrap}>
              <Text style={styles.popularHeader}>Popular cities</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroller}>
                {populars.map(renderPopularChip)}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.results}>
            {error ? (
              <View style={styles.errWrap}>
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : (
              <FlatList
                data={itemsGrouped.length > 0 ? itemsGrouped : itemsRaw}
                keyExtractor={(i) => i.id}
                keyboardShouldPersistTaps="handled"
                renderItem={renderRow}
                ListEmptyComponent={() =>
                  loading ? null : (
                    <View style={styles.empty}>
                      <Text style={styles.emptyText}>{query ? "No matching results" : "No data found"}</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "flex-end",
  },
  backdropTouchable: { flex: 1 },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: Platform.OS === "ios" ? "78%" : "80%",
    minHeight: "70%",
    paddingBottom: 18,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 6 },
  cancelBtn: { marginLeft: 12, paddingHorizontal: 8, paddingVertical: 6 },
  cancelText: { color: colors.primary, fontWeight: "600" },

  popularWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  popularHeader: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 8 },
  popularScroller: { paddingRight: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF6F9",
    borderWidth: 1,
    borderColor: colors.lightBorder,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.primary },

  results: { paddingHorizontal: 8, paddingBottom: 8, flex: 1 },

  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  sublocItem: { backgroundColor: "#FAFAFB" },
  sublocGrouped: { paddingLeft: 28 },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  itemTitleSubloc: { fontSize: 14, fontWeight: "500" },
  itemSubtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  itemTag: { fontSize: 12, color: "#999", marginLeft: 8 },
  cityTag: { fontSize: 12, color: colors.primary, marginLeft: 8, fontWeight: "700" },

  empty: { padding: 28, alignItems: "center" },
  emptyText: { color: "#666" },

  errWrap: { padding: 12 },
  errText: { color: "red" },
});

export default LocationSearchModal;
