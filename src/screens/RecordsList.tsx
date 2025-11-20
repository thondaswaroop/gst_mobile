// src/screens/RecordsList.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../components/common/Text';
import { CustomIcon, colors } from '../utils/libraryAssets';
import globalStyles from '../styles/globalStyles';
import { spacing, fontSizes } from '../styles/default';
import { Images } from '../utils/resources';

const { width } = Dimensions.get('window');

type Schedule = {
  id: string;
  busNumber: string;
  via?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  seatsAvailable: number;
  price: string;
  vehicleType: string;
};

const MOCK: Schedule[] = [
  { id: '1', busNumber: 'S 4455 BC', via: 'Relay Service', departureTime: '12:00 PM', arrivalTime: '17:00 PM', duration: '2 Stops', seatsAvailable: 2, price: '₹300', vehicleType: 'bus' },
  { id: '2', busNumber: 'S 4455 BC', via: 'Direct Service', departureTime: '13:00 PM', arrivalTime: '18:00 PM', duration: 'No Stops', seatsAvailable: 4, price: '₹300', vehicleType: 'flight' },
  { id: '3', busNumber: 'S 4455 BC', via: 'Direct Service', departureTime: '14:00 PM', arrivalTime: '19:00 PM', duration: 'No stops', seatsAvailable: 2, price: '₹300', vehicleType: 'flight' },
  { id: '4', busNumber: 'S 4455 BC', via: 'Relay Service', departureTime: '15:00 PM', arrivalTime: '20:00 PM', duration: '1 Stop', seatsAvailable: 6, price: '₹300' , vehicleType: 'cab' },
  { id: '5', busNumber: 'S 4455 BC', via: 'Direct Service', departureTime: '16:00 PM', arrivalTime: '21:00 PM', duration: 'No Stops', seatsAvailable: 1, price: '₹300', vehicleType: 'cab' },
];

const RecordsList: React.FC = () => {
  const navigation = useNavigation();

  const data = useMemo(() => MOCK, []);

  const openSchedule = (item: Schedule) => {
    // navigation logic
    navigation.navigate('SeatLayout' as never)
  };

  // helper: map vehicleType to icon name (use your icon set names)
  const getIconNameForType = (type?: string) => {
    if (!type) return 'bus';
    const t = type.toLowerCase();
    switch (t) {
      case 'bus':
        return 'bus';
      case 'cab':
      case 'car':
        return 'car';
      case 'sedan':
        return 'car-sport'; // if you have this icon
      case 'helicopter':
        return 'helicopter';
      case 'flight':
      case 'plane':
      case 'airplane':
        return 'airplane'; // ensure 'airplane' exists in your icon set
      default:
        return 'bus';
    }
  };

  // optional: image fallback for nicer visuals (Images.busImg, Images.cabImg etc.)
  const getImageForType = (type?: string) => {
    if (!type) return undefined;
    const t = type.toLowerCase();
    switch (t) {
      case 'bus':
        return Images.busImg ?? Images.vehicleBus;
      case 'cab':
      case 'car':
        return Images.cabImg ?? Images.vehicleCab;
      case 'sedan':
        return Images.sedanImg ?? Images.vehicleSedan;
      case 'helicopter':
        return Images.heliImg ?? Images.vehicleHelicopter;
      case 'flight':
        return Images.flightImg ?? Images.vehiclePlane;
      default:
        return undefined;
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <CustomText variant="title" style={styles.headerTitle}>
        Schedule Available
      </CustomText>
    </View>
  );

  const renderItem = ({ item }: { item: Schedule }) => {
    const iconName = getIconNameForType(item.vehicleType);
    const img = getImageForType(item.vehicleType);

    return (
      <TouchableOpacity onPress={() => openSchedule(item)} activeOpacity={0.88} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.busCircle}>
              {img ? (
                <Image source={img} style={styles.vehicleImageSmall} resizeMode="contain" />
              ) : (
                <CustomIcon iconName={iconName as any} size={18} color={colors.onPrimary} />
              )}
            </View>

            <View style={{ marginLeft: spacing.md }}>
              <CustomText variant="xSmall" style={styles.smallLabel}>Vehicle Number</CustomText>
              <CustomText variant="body" style={styles.busNumber}>{item.busNumber}</CustomText>
            </View>
          </View>

          {item.via ? (
            <View style={styles.viaPill}>
              <CustomIcon iconName="flash" size={14} color={colors.primary} />
              <CustomText variant="xSmall" style={styles.viaText}>{item.via}</CustomText>
            </View>
          ) : null}
        </View>

        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <CustomText variant="title" style={styles.timeText}>{item.departureTime}</CustomText>
            <CustomText variant="xSmall" style={styles.timeLabel}>Departure</CustomText>
          </View>

          <View style={styles.durationBlock}>
            <View style={styles.durationBadge}>
              <CustomText variant="xSmall" style={styles.durationText}>{item.duration}</CustomText>
            </View>
          </View>

          <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
            <CustomText variant="title" style={styles.timeText}>{item.arrivalTime}</CustomText>
            <CustomText variant="xSmall" style={styles.timeLabel}>Destination</CustomText>
          </View>
        </View>

        <View style={styles.sep} />

        <View style={styles.bottomRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CustomIcon iconName="people" size={16} color={colors.textSecondary} />
            <View style={{ marginLeft: 8 }}>
              <CustomText variant="xSmall" style={styles.smallLabel}>Seats Available</CustomText>
              <CustomText variant="body" style={styles.seatsText}>{item.seatsAvailable} Seats</CustomText>
            </View>
          </View>

          <CustomText variant="title" style={styles.priceText}>{item.price}</CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.page}>
      <FlatList
        data={data}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default RecordsList;

const CARD_PADDING = spacing.lg;
const CARD_RADIUS = 14;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    marginVertical:10,
    marginHorizontal:10
  },
  listContent: {
    paddingBottom: 36,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.large,
    color: colors.textPrimary,
    flex: 1,
  },

  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: CARD_RADIUS,
    padding: CARD_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  busCircle: {
    width: 44,
    height: 44,
    borderRadius: 44 / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicleImageSmall: {
    width: 28,
    height: 28,
  },

  smallLabel: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
  },
  busNumber: {
    fontSize: fontSizes.medium,
    color: colors.textPrimary,
    fontWeight: '700',
  },

  viaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.lightCard,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  viaText: {
    fontSize: fontSizes.small,
    marginLeft: 8,
    color: colors.textSecondary,
  },

  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  timeBlock: {
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeLabel: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
    marginTop: 4,
  },

  durationBlock: {
    width: 88,
    alignItems: 'center',
  },
  durationBadge: {
    backgroundColor: colors.lightCard,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  durationText: {
    fontSize: fontSizes.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  sep: {
    height: 1,
    backgroundColor: colors.lightBorder,
    marginVertical: spacing.sm,
    borderRadius: 2,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  priceText: {
    fontSize: fontSizes.large,
    color: colors.primary,
    fontWeight: '800',
  },
});
