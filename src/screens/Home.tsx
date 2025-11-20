// src/screens/Home.tsx
import React, { useState } from "react";
import {
  View,
  Platform,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import Button from "../components/common/Button";
import CustomText from "../components/common/Text";
import colors from "../constants/colors";
import globalStyles from "../styles/globalStyles";
import { Images } from "../utils/resources";
import { fontSizes, spacing } from "../styles/default";
import DatePicker from "../components/DatePicker";
import { common } from "../constants/common";
import LocationSearchModal, { PlaceItem } from "../components/LocationSearchModal";
import apiClient from "../providers/api";
import { useToast } from "react-native-toast-notifications";
import { showToast } from "../utils/toastService";
import { formatDate } from "../utils/formatDate";
import { extractNumericId, readLatLngFromItem, resolveSublocation } from "../utils/helper";

const { width } = Dimensions.get("window");
const ENDORSE_CARD_WIDTH = Math.min(320, width * 0.78);
const ENDORSE_CARD_SPACING = 12;

const Home: React.FC = () => {
  const [departure, setDeparture] = useState<PlaceItem | null>(null);
  const [destination, setDestination] = useState<PlaceItem | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<"departure" | "destination">("departure");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [tripDate, setTripDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const onPickDate = () => setDatePickerVisible(true);
  const onDateConfirm = (d: Date) => {
    if (d instanceof Date && !isNaN(d.getTime())) setTripDate(d);
    setDatePickerVisible(false);
  };
  const onDateCancel = () => setDatePickerVisible(false);

  const openSearch = (mode: "departure" | "destination") => {
    setSearchMode(mode);
    setSearchModalVisible(true);
  };

  /**
   * Normalize and extract numeric ids from a PlaceItem.
   * Always return:
   *  - sublocation_id (number|null)
   *  - location_id (number|null) -- parent location id for either a location or sublocation
   */
  const getNormalizedIds = (p: PlaceItem | null) => {
    if (!p) return { sublocation_id: null as number | null, location_id: null as number | null };
    const meta = (p.meta && typeof p.meta === "object") ? p.meta : {};
    // possible places where id may live:
    // p.id (string like "loc-12" or "subloc-45"), meta.id, meta.sublocation_id, meta.location_id
    const idFromMeta = meta.id ?? meta.sublocation_id ?? meta.sublocationId ?? meta.location_id ?? meta.locationId ?? null;
    // parse p.id suffix if present
    const idFromIdStr = extractNumericId(p.id);
    const subFromMeta = meta.sublocation_id ?? meta.sublocationId ?? null;
    const locFromMeta = meta.location_id ?? meta.locationId ?? null;

    const sub = subFromMeta ?? (p.type === "sublocation" ? (Number.isFinite(Number(idFromIdStr)) ? Number(idFromIdStr) : null) : null);
    const loc = locFromMeta ?? (p.type === "location" ? (Number.isFinite(Number(idFromIdStr)) ? Number(idFromIdStr) : null) : null) ?? (meta.id && meta.id !== sub ? extractNumericId(meta.id) : null);

    return {
      sublocation_id: typeof sub === "number" ? sub : (sub ? Number(sub) : null),
      location_id: typeof loc === "number" ? loc : (loc ? Number(loc) : null),
    };
  };

  const onSelectPlace = (item: PlaceItem) => {
    if (common.DEBUG) console.log('selected item', item);
    const other = searchMode === "departure" ? destination : departure;
    const thisIds = getNormalizedIds(item);
    const otherIds = getNormalizedIds(other);
    if (common.DEBUG) console.log('thisIds', thisIds, 'otherIds', otherIds);

    setSearchModalVisible(false);

    // disallow same main location
    if (thisIds.location_id && otherIds.location_id && thisIds.location_id === otherIds.location_id) {
      showToast("default", toast, "Origin and destination cannot be the same city/location.");
      return;
    }
    // disallow same sublocation
    if (thisIds.sublocation_id && otherIds.sublocation_id && thisIds.sublocation_id === otherIds.sublocation_id) {
      showToast("default", toast, "Origin and destination cannot be the same boarding point.");
      return;
    }
    // disallow selecting parent location when the other is its sublocation (and vice versa)
    // if this is a location (city) and other is a sublocation that belongs to this city
    if (thisIds.location_id && otherIds.sublocation_id && thisIds.location_id === otherIds.location_id) {
      showToast("default", toast, "Selected city contains the other selected boarding point. Pick a different place.");
      return;
    }
    // if this is a sublocation which belongs to the same city as other (other is a location)
    if (thisIds.sublocation_id && otherIds.location_id && thisIds.location_id && thisIds.location_id === otherIds.location_id) {
      showToast("default", toast, "Selected boarding point belongs to the same city as the other side.");
      return;
    }

    if (searchMode === "departure") setDeparture(item);
    else setDestination(item);
    setSearchModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!departure || !destination) {
      showToast("default", toast, "Select both origin and destination.");
      return;
    }

    setSubmitting(true);
    try {
      const fromMeta: any = departure.meta ?? {};
      const toMeta: any = destination.meta ?? {};

      // quick sublocation extraction if server included it in meta
      const fromQuick = (fromMeta.sublocation_id ?? fromMeta.sublocationId ?? (departure.type === "sublocation" ? extractNumericId(departure.id) : null));
      const toQuick = (toMeta.sublocation_id ?? toMeta.sublocationId ?? (destination.type === "sublocation" ? extractNumericId(destination.id) : null));

      let fromPrepared: any = null;
      let toPrepared: any = null;

      if (fromQuick && Number.isFinite(Number(fromQuick))) {
        const latlng = readLatLngFromItem(departure);
        fromPrepared = { sublocation_id: Number(fromQuick), lat: latlng.lat, lng: latlng.lng, meta: fromMeta };
      } else {
        fromPrepared = await resolveSublocation(departure);
      }

      if (toQuick && Number.isFinite(Number(toQuick))) {
        const latlng = readLatLngFromItem(destination);
        toPrepared = { sublocation_id: Number(toQuick), lat: latlng.lat, lng: latlng.lng, meta: toMeta };
      } else {
        toPrepared = await resolveSublocation(destination);
      }

      if (common.DEBUG) console.log('final prepared', fromPrepared, toPrepared);

      if (!fromPrepared || !toPrepared) {
        if (common.DEBUG) {
          console.log("fromPrepared:", fromPrepared, "toPrepared:", toPrepared);
        }
        showToast(
          "default",
          toast,
          "Could not resolve boarding points (sublocations) for origin or destination. Please choose different places or update the server to return sublocation ids/coords."
        );
        return;
      }

      if (!tripDate) {
        showToast("default", toast, "Please choose travel date.");
        return;
      }

      // Build payload from resolved objects
      const payload = {
        origin: {
          sublocation_id: fromPrepared.sublocation_id ?? null,
          lat: fromPrepared.lat ?? null,
          lng: fromPrepared.lng ?? null,
        },
        destination: {
          sublocation_id: toPrepared.sublocation_id ?? null,
          lat: toPrepared.lat ?? null,
          lng: toPrepared.lng ?? null,
        },
        travel_date: tripDate.toISOString().slice(0, 10), // YYYY-MM-DD
        earliest_time: "00:00",
        latest_time: "23:59",
        max_transfers: 1,
        min_transfer_minutes: 10,
        search_radius_km: 8,
      };

      if (common.DEBUG) console.log("search payload:", payload);

      // call API
      const res: any = await apiClient.post("searchTrips", payload);
        console.log("searchTrips res:", res);
      // after const res: any = await apiClient.post("searchTrips", payload);
if (res && res.ok) {
  if (res.data && res.data.note === 'no_trips_in_chosen_direction' && Array.isArray(res.data.candidates?.reverse_candidate_route_ids) && res.data.candidates.reverse_candidate_route_ids.length > 0) {
      // present UI prompt: "No trips in chosen direction — show return trips?"
      showToast("default", toast, "No trips in this direction. Would you like to search return trips?");
      // optionally auto-run a swapped payload:
      // const swappedPayload = { ...payload, origin: payload.destination, destination: payload.origin }
      // then call apiClient.post("searchTrips", swappedPayload) if user accepts.
  } else if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      // normal handling
      showToast("success", toast, "Search completed — found trips.");
      console.log("searchTrips response:", res.data.data);
  } else {
      showToast("default", toast, "No trips found.");
  }
}

    } catch (err) {
      console.warn("search error", err);
      showToast("default", toast, "Failed to search trips. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const endorsements = [
    { id: "e1", title: "Early-bird Offer", subtitle: "Save up to 20% on morning departures", img: Images.authBg, cta: "Book Now" },
    { id: "e2", title: "Premium Cab Upgrade", subtitle: "Comfort rides at great prices", img: Images.authBg, cta: "Upgrade" },
    { id: "e3", title: "Helicopter Sightseeing", subtitle: "Short hops — big views", img: Images.authBg, cta: "View" },
    { id: "e4", title: "Family Pack", subtitle: "Group discounts — save more", img: Images.authBg, cta: "Explore" },
  ];

  const renderEndorse = ({ item }: any) => (
    <TouchableOpacity key={item.id} activeOpacity={0.92} style={styles.endorseCard}>
      <ImageBackground source={item.img} style={styles.endorseImage} imageStyle={styles.endorseImageRadius}>
        <View style={styles.endorseGradient} />
        <View style={styles.endorseContent}>
          <CustomText variant="small" color={colors.white}>{item.title}</CustomText>
          <CustomText variant="xSmall" color={colors.white}>{item.subtitle}</CustomText>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Image source={Images.maleIcon} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <CustomText variant="body" style={styles.greeting}>
                  Hello, <CustomText variant="title" style={styles.greetingName}>Ramesh Kumar 👋</CustomText>
                </CustomText>
                <CustomText variant="small" color={colors.white}>Welcome to {common.APP_NAME} Services</CustomText>
              </View>
            </View>
            <View style={[styles.headerCopy, globalStyles.mb20]}>
              <CustomText variant="title" style={styles.headerTitle}>Safe and Comfortable Travel across India</CustomText>
            </View>
          </View>

          <View style={styles.searchCardWrapper}>
            <View style={styles.searchCard}>
              <CustomText variant="xSmall" style={globalStyles.mb10}>Complete the form below to purchase {common.APP_NAME} tickets</CustomText>

              <TouchableOpacity style={styles.row} onPress={() => openSearch("departure")} activeOpacity={0.85}>
                <View style={styles.rowLeft}>
                  <Image source={Images.logo} style={styles.rowIcon} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="small_hand">From</CustomText>
                    <CustomText variant="small">{departure ? departure.title : "Select your travel from"}</CustomText>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={() => openSearch("destination")} activeOpacity={0.85}>
                <View style={styles.rowLeft}>
                  <Image source={Images.logo} style={styles.rowIcon} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="small_hand">To</CustomText>
                    <CustomText variant="small">{destination ? destination.title : "Select your travel destination"}</CustomText>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={onPickDate} activeOpacity={0.85}>
                <View style={styles.rowLeft}>
                  <Image source={Images.logo} style={styles.rowIcon} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="small_hand">Date</CustomText>
                    <CustomText variant="small">{formatDate(tripDate)}</CustomText>
                  </View>
                </View>
              </TouchableOpacity>

              <Button title={submitting ? "Preparing..." : "Search"} onPress={handleSubmit} fullWidth size="custom" disabled={submitting} />
            </View>
          </View>

          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <CustomText variant="title" style={styles.sectionTitle}>Recommended for you</CustomText>
              <CustomText variant="xSmall" style={styles.sectionSub}>Trending offers & premium services</CustomText>
            </View>
            <FlatList data={endorsements} keyExtractor={(it) => it.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.endorseScroller} renderItem={renderEndorse} snapToAlignment="start" decelerationRate="fast" snapToInterval={Math.min(320, width * 0.78) + 12} />
          </View>
        </ScrollView>
      </View>
      <LocationSearchModal visible={searchModalVisible} onRequestClose={() => setSearchModalVisible(false)} onSelect={onSelectPlace} maxResults={400} />
      <DatePicker visible={datePickerVisible} initialDate={tripDate ?? new Date()} minDate={new Date()} onConfirm={onDateConfirm} onCancel={onDateCancel} title="Select travel date" />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.lightBorder },
  screen: { flex: 1, backgroundColor: colors.lightBorder },
  scrollContent: { paddingBottom: 36 },

  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 46 : 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headerCopy: { alignItems: "flex-start" },
  avatar: { width: 40, height: 40, tintColor: colors.white },
  greeting: { color: colors.white, fontSize: 15 },
  greetingName: { color: colors.white, fontSize: 15 },
  headerTitle: { color: colors.white, fontSize: fontSizes.medium, marginBottom: 6, fontFamily: "Poppins-Bold" },

  searchCardWrapper: { paddingHorizontal: 16, marginTop: -36 },
  searchCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  row: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.lightBorder, paddingHorizontal: 14, marginBottom: 12, alignItems: "center", flexDirection: "row", backgroundColor: colors.surfaceLight },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowIcon: { width: 22, height: 22, marginRight: 12, tintColor: colors.textSecondary },

  sectionWrapper: { marginTop: spacing.md, paddingHorizontal: 16, marginBottom: 80 },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: fontSizes.medium, color: colors.textPrimary, fontFamily: "Poppins-Bold" },
  sectionSub: { fontSize: fontSizes.small, color: colors.textSecondary },

  endorseScroller: { paddingVertical: 6, alignItems: "center" },
  endorseCard: { width: ENDORSE_CARD_WIDTH, height: 150, borderRadius: 14, marginRight: ENDORSE_CARD_SPACING, overflow: "hidden", backgroundColor: colors.surfaceLight },
  endorseImage: { flex: 1, justifyContent: "flex-end" },
  endorseImageRadius: { borderRadius: 14 },
  endorseGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.18)" },
  endorseContent: { padding: 12 },
  endorseCtaWrap: { marginTop: 12, alignSelf: "flex-start", backgroundColor: colors.onPrimary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});

export default Home;
