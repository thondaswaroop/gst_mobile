import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Text,
  FlatList,
  Platform,
} from 'react-native';
import colors from '../constants/colors';
import CustomText from './common/Text';
import { spacing } from '../styles/default';

const { height } = Dimensions.get('window');

export type PlaceItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type BottomSheetProps = {
  visible: boolean;
  title?: string;
  data: PlaceItem[];
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (item: PlaceItem) => void;
};

const SHEET_HEIGHT = Math.min(height * 0.78, 720);

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, title = 'Select', data, selectedId, onClose, onSelect }) => {
  const animY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(animY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(animY, { toValue: SHEET_HEIGHT, duration: 320, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const renderItem = ({ item }: { item: PlaceItem }) => {
    const selected = item.id === selectedId;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.iconCircle, selected ? styles.iconCircleActive : styles.iconCircleDefault]} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <CustomText variant="body" style={[styles.rowTitle]}>{item.title}</CustomText>
            {item.subtitle ? <CustomText variant="xSmall" style={styles.rowSubtitle}>{item.subtitle}</CustomText> : null}
          </View>
        </View>

        <View style={styles.radioWrap}>
          <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
            {selected ? <View style={styles.radioInner} /> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      {/* Backdrop */}
      <TouchableOpacity activeOpacity={1} style={styles.backdropTouchable} onPress={onClose}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdrop }]} />
      </TouchableOpacity>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: animY }] }]}>
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>

        <View style={styles.headerRow}>
          <CustomText variant="title" weight="bold" style={styles.sheetTitle}>{title}</CustomText>
        </View>

        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,10,20,0.48)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    zIndex: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    overflow: 'hidden',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingTop: 10,
  },
  handle: {
    width: 96,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.lightBorder,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sheetTitle: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  row: {
    height: 78,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowSelected: {
    borderColor: colors.highlightYellow,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 34 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleDefault: {
    backgroundColor: colors.lightBorder,
  },
  iconCircleActive: {
    backgroundColor: colors.highlightYellow,
  },
  rowTitle: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioWrap: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 22 / 2,
    borderWidth: 2,
    borderColor: colors.lightBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.highlightYellow },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 10 / 2,
    backgroundColor: colors.highlightYellow,
  },
});

export default BottomSheet;
