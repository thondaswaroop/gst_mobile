// src/screens/SeatLayout.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Button, colors, CustomIcon, CustomText } from "../utils/libraryAssets";
import globalStyles from "../styles/globalStyles";
import { Images } from "../utils/resources";

const { width } = Dimensions.get("window");

type SeatCell = { type: "seat" | "aisle"; label?: string };
type SeatRow = SeatCell[];

const SeatLayout: React.FC = () => {
  const route: any = useRoute();

  // ---------------- MOCK / API DATA (fallback) ----------------
  const apiData =
    route?.params?.data ?? {
      seatLayout: {
        num_rows: 3,
        cols_a: 3,
        cols_b: 1,
        cols_total: 4,
        seat_map: [
          [
            { type: "seat", label: "1A" },
            { type: "seat", label: "1B" },
            { type: "seat", label: "1C" },
            { type: "aisle" },
            { type: "seat", label: "1D" },
          ],
          [
            { type: "seat", label: "2A" },
            { type: "seat", label: "2B" },
            { type: "seat", label: "2C" },
            { type: "aisle" },
            { type: "seat", label: "2D" },
          ],
          [
            { type: "seat", label: "3A" },
            { type: "seat", label: "3B" },
            { type: "seat", label: "3C" },
            { type: "aisle" },
            { type: "seat", label: "3D" },
          ],
        ],
        blocked_seats: ["3D", "3C", "3B", "1A"],
        window_seats: ["2A", "2D", "3A"],
        driver_seat: "1D",
      },
      vehicle: {
        model: "Volvo B9R",
        registration_number: "AP09TX1234",
        capacity: 40,
        ac: true,
        relay_service: true,
      },
      relay: {
        drop_points: [
          { id: "d1", name: "Vijayawada Bus Stand", eta: "08:25" },
          { id: "d2", name: "Nellore Junction", eta: "10:40" },
          { id: "d3", name: "Chennai Central", eta: "13:30" },
        ],
        vehicles: [
          { id: "v1", model: "Volvo B9R", reg: "AP09TX1234", covers: "Vijayawada → Nellore" },
          { id: "v2", model: "Mercedes Tourismo", reg: "TN07AB9876", covers: "Nellore → Chennai" },
        ],
      },
      specs: { price_per_km: "25.5", ac_type: "AC", year_of_mfg: "2021" },
    };

  // ---------------- HOOKS / STATE ----------------
  const layout: SeatRow[] = apiData?.seatLayout?.seat_map ?? [];
  const blockedSeats = useMemo(() => apiData?.seatLayout?.blocked_seats ?? [], [apiData]);
  const windowSeats = useMemo(() => apiData?.seatLayout?.window_seats ?? [], [apiData]);
  const driverSeat = useMemo(() => apiData?.seatLayout?.driver_seat ?? null, [apiData]);
  const baseFare = parseFloat(apiData?.specs?.price_per_km ?? "50") * 10;

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [relayOpen, setRelayOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  // ---------- layout sizing ----------
  const maxCols = Math.max(1, layout.reduce((m, r) => Math.max(m, r.length), 0));
  const seatSize = Math.max(44, Math.min(68, Math.floor((width - 140) / maxCols)));

  // ---------- helpers ----------
  const isBlocked = (label?: string) => !!label && blockedSeats.includes(label);
  const isDriver = (label?: string) => !!label && driverSeat === label;
  const isWindow = (label?: string) => !!label && windowSeats.includes(label);

  const toggleSeat = (label?: string) => {
    if (!label) return;
    if (isBlocked(label) || isDriver(label)) return; // non-clickable
    setSelectedSeats((prev) => (prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]));
  };

  const totalFare = (selectedSeats.length * baseFare).toFixed(2);

  // find nearest aisle index in a row to decide window left/right
  const nearestAisleIndex = (row: SeatRow, idx: number) => {
    const aisles = row.map((c, i) => (c.type === "aisle" ? i : -1)).filter((i) => i >= 0);
    if (!aisles.length) return null;
    let best = aisles[0];
    let bestDist = Math.abs(idx - best);
    for (let a of aisles) {
      const d = Math.abs(idx - a);
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  };

  // ---------- small UI components ----------
  const ColumnHeader = () => {
    const topRow = layout[0] ?? [];
    let colLetterIndex = 0;
    return (
      <View style={styles.columnHeaderRow}>
        <View style={styles.rowNumberCell} />
        <View style={[styles.colCells, { minWidth: maxCols * seatSize }]}>
          <View style={styles.colNumberRow}>
            {topRow.map((cell, idx) => {
              if (cell.type === "aisle") {
                return <View key={`col-${idx}`} style={[styles.colNumberCell, { width: seatSize }]} />;
              }
              const letter = String.fromCharCode(65 + colLetterIndex); // A, B, C...
              colLetterIndex += 1;
              return (
                <View key={`col-${idx}`} style={[styles.colNumberCell, { width: seatSize }]}>
                  <Text style={styles.colLetterText}>{letter}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const RowNumber = ({ i }: { i: number }) => {
    const num = i + 1;
    return (
      <View style={styles.rowNumberCell}>
        <Text style={styles.rowNumberText}>{num}</Text>
      </View>
    );
  };

  const SeatBlock = ({ cell, row, idx }: { cell: SeatCell; row: SeatRow; idx: number }) => {
    if (cell.type === "aisle") {
      return <View key={`aisle-${idx}`} style={[styles.aisleSpacer, { width: seatSize }]} />;
    }

    const label = cell.label!;
    const blocked = isBlocked(label);
    const driver = isDriver(label);
    const selected = selectedSeats.includes(label);
    const window = isWindow(label);

    // determine window side relative to nearest aisle
    const aisleIdx = nearestAisleIndex(row, idx);
    let windowSide: "left" | "right" = "left";
    if (aisleIdx === null) {
      windowSide = idx < Math.floor(row.length / 2) ? "left" : "right";
    } else {
      windowSide = idx < aisleIdx ? "left" : "right";
    }

    const containerStyle = [
      styles.seatCell,
      {
        width: seatSize - 8,
        height: seatSize - 8,
        borderRadius: Math.max(10, Math.floor((seatSize - 8) / 6)),
        borderColor: selected ? "#0b63d6" : blocked ? "#f6c6c6" : "#eaf1fb",
        backgroundColor: blocked ? "#fff6f6" : selected ? "#0b63d6" : "#ffffff",
      },
    ];

    const labelStyle = [styles.seatLabel, { color: selected ? "#fff" : blocked ? "#7a1b1b" : "#12324a" }];

    const imgSource = driver ? Images.driver : blocked ? Images.blocked : Images.seat;

    const inner = (
      <View style={containerStyle}>
        {window && <View style={[styles.windowDot, windowSide === "left" ? { left: 8 } : { right: 8 }]} />}
        {imgSource ? (
          <Image
            source={imgSource}
            style={{
              width: Math.round((seatSize - 8) * 0.46),
              height: Math.round((seatSize - 8) * 0.46),
              resizeMode: "contain",
              marginBottom: 4,
            }}
          />
        ) : (
          <Text style={styles.seatIcon}>{driver ? "D" : "S"}</Text>
        )}
        <Text style={labelStyle}>{label}</Text>
      </View>
    );

    if (blocked || driver) {
      return (
        <View key={label} style={{ marginHorizontal: 6, alignItems: "center", justifyContent: "center" }}>
          {inner}
        </View>
      );
    }

    return (
      <Pressable
        key={label}
        android_ripple={{ color: "#EAF4FF" }}
        onPress={() => toggleSeat(label)}
        style={{ marginHorizontal: 6 }}
      >
        {inner}
      </Pressable>
    );
  };

  const relay = apiData?.relay ?? null;
  const vehicle = apiData?.vehicle ?? null;

  // clear selection helper
  const clearSelection = () => setSelectedSeats([]);

  return (
    <SafeAreaView style={styles.container}>
      {/* top hero banner */}
      <View style={styles.hero}>
        <View>
          <CustomText variant="body" style={globalStyles.mb10}>Choose your seat</CustomText>
          <CustomText variant="small">
            {vehicle?.model ?? "Vehicle"} • {vehicle?.ac ? "AC" : "Non-AC"} • Reg: {vehicle?.registration_number ?? "--"}
          </CustomText>
        </View>
        <View style={styles.heroRight}>
          <CustomText style={styles.heroCapacity}>{vehicle?.capacity ?? "—"}</CustomText>
          <CustomText variant="xSmall">Seats</CustomText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* compact vehicle accordion */}
        <View style={styles.infoCard}>
          <TouchableOpacity onPress={() => setRelayOpen((s) => !s)} activeOpacity={0.9} style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <CustomText variant="caption"> Vehicle and trip details </CustomText>
            </View>
            <View style={styles.iconWrap}>
              {/* <Text style={styles.iconArrow}>{relayOpen ? "▲" : "▼"}</Text> */}
              <CustomIcon iconName={relayOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {relayOpen && relay && (
            <View style={styles.relayBlock}>
              {relay.drop_points?.map((d: any, i: number) => (
                <View style={styles.dropPointRow} key={d.id ?? `${i}`}>
                  <View style={styles.dotSmall} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="small">Volvo B9R</CustomText>
                    <View style={[globalStyles.flex,{justifyContent:'space-between'}]}>
                      <CustomText variant="xSmall">{d.name}</CustomText>
                      <CustomText variant="xSmall" >ETA: {d.eta ?? "—"}</CustomText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <ColumnHeader />

        <View style={styles.gridWrapper}>
          {layout.map((row, rIdx) => (
            <View key={`row-${rIdx}`} style={styles.rowWrapper}>
              <RowNumber i={rIdx} />
              <View style={[styles.rowCells, { minWidth: maxCols * seatSize }]}>
                <View style={[styles.rowInner, { height: seatSize }]}>
                  {row.map((cell, cIdx) => (
                    <SeatBlock key={`${rIdx}-${cIdx}`} cell={cell} row={row} idx={cIdx} />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.legendWrap}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { borderColor: "#E6EDF7", backgroundColor: "#FFFFFF" }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: "#FBE7E7", borderColor: "#F6C6C6" }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: "#0b63d6", borderColor: "#0b63d6" }]} />
            <Text style={[styles.legendText, { color: "#0b63d6" }]}>Selected</Text>
          </View>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ---------- FOOTER: left = seats + price, right = Book now CTA ---------- */}
      <View style={styles.footerWrapper}>
        <SafeAreaView edges={["bottom"] as any} style={styles.footerInner}>
          <View style={styles.leftArea}>
            <Text style={styles.leftCountText}>
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""}
            </Text>
            <Text style={{ marginTop: 4, fontWeight: "800", color: "#0b2540" }}>Total : ₹ {totalFare}</Text>
          </View>

          <View style={styles.rightArea}>
            <Button
              size="medium"
              style={[selectedSeats.length === 0 && styles.ctaDisabled]}
              onPress={() => console.log("Proceed with: ", selectedSeats)}
              title="Book now"
            />
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

export default SeatLayout;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFD" },

  /* hero header - soft rounded */
  hero: {
    backgroundColor: "#EAF6FF",
    paddingTop: Platform.OS === "ios" ? 36 : 20,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#073b66" },
  heroSubtitle: { fontSize: 12, color: "#4b6a80", marginTop: 6 },
  heroRight: { alignItems: "center" },
  heroCapacity: { fontSize: 18, fontWeight: "900", color: "#0b63d6" },
  heroCapacityLabel: { fontSize: 12, color: "#607b90" },

  scrollArea: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEF6FF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoTitle: { fontSize: 15, fontWeight: "800", color: "#0b3a57" },
  infoSmall: { color: "#607b90", marginTop: 4 },

  iconWrap: { paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  iconArrow: { fontSize: 16, color: "#0b63d6" },

  relayBlock: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#EEF6FF", padding: 12, },
  relayHeading: { fontWeight: "700", color: "#12324a", marginBottom: 8 },
  dropPointRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dotSmall: { width: 20, height: 20, borderRadius: 6, backgroundColor: colors.brandGreen, marginRight: 10 },
  dropTitle: { fontWeight: "700", color: "#0b3a57" },
  dropSub: { color: "#607b90", marginTop: 2 },

  vehicleToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  vehicleToggleText: { color: "#0b63d6", fontWeight: "700" },
  vehicleToggleArrow: { color: "#0b63d6", fontWeight: "700" },

  vehicleRow: { paddingVertical: 8, borderBottomColor: "#f2f6fb", borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  vehLeft: {},
  vehModel: { fontWeight: "800", color: "#0b3a57" },
  vehReg: { color: "#607b90", marginTop: 2 },
  vehCovers: { color: "#47607a", maxWidth: 160 },

  /* grid header */
  columnHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, paddingLeft: 2 },
  rowNumberCell: { width: 36, alignItems: "center", justifyContent: "center" },
  rowNumberText: { fontSize: 13, color: "#4B5563", fontWeight: "700" },
  colCells: { flexDirection: "row", overflow: "hidden" },
  colNumberRow: { flexDirection: "row" },
  colNumberCell: { alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  colLetterText: { color: "#6B7280", fontWeight: "800", fontSize: 13 },

  /* grid */
  gridWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEF2F8",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  rowWrapper: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rowCells: { flex: 1 },
  rowInner: { flexDirection: "row", alignItems: "center" },

  aisleSpacer: { backgroundColor: "transparent" },

  seatCell: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },

  seatIcon: { fontSize: 14, marginBottom: 4 },
  seatLabel: { fontSize: 12, fontWeight: "800" },

  windowDot: { position: "absolute", top: 8, width: 8, height: 12, borderRadius: 2, backgroundColor: "#9EE7B9" },

  legendWrap: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingHorizontal: 20 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendSwatch: { width: 18, height: 18, borderRadius: 6, marginRight: 8, borderWidth: 1 },
  legendText: { color: "#374151", fontSize: 13 },

  /* ---------- FOOTER (adjusted) ---------- */
  footerWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },

  leftArea: {
    flex: 1,
    justifyContent: "center",
  },
  leftCountText: { fontWeight: "800", color: "#073b66", fontSize: 14 },

  rightArea: {
    width: 140,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  ctaDisabled: {
    backgroundColor: "#9bb7e6",
  },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  ctaTextDisabled: { color: "#fff" },
});
