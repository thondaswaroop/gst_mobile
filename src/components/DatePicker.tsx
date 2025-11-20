// src/components/DatePicker.tsx
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import colors from '../constants/colors';
import { spacing } from '../styles/default';
import CustomText from './common/Text';

type Props = {
  visible: boolean;
  initialDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  // If true, the Android picker will open automatically (default true).
  autoOpenAndroid?: boolean;
};

const defaultTitle = 'Select date';

const DatePicker: React.FC<Props> = ({
  visible,
  initialDate,
  minDate,
  maxDate,
  onConfirm,
  onCancel,
  title = defaultTitle,
  autoOpenAndroid = true,
}) => {
  const [localDate, setLocalDate] = useState<Date>(initialDate ?? new Date());
  const [androidShow, setAndroidShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalDate(initialDate ?? new Date());
      // On Android we will trigger system picker
      if (Platform.OS === 'android' && autoOpenAndroid) {
        // small timeout so modal/backdrop has time to appear if used
        setTimeout(() => setAndroidShow(true), 50);
      }
    } else {
      setAndroidShow(false);
    }
  }, [visible, initialDate, autoOpenAndroid]);

  // Android: handle the picker event
  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date | undefined) => {
    setAndroidShow(false);
    // if user dismissed (event.type === 'dismissed'), just call cancel
    if (event.type === 'dismissed') {
      onCancel();
      return;
    }
    if (selected) {
      onConfirm(selected);
    } else {
      onCancel();
    }
  };

  // iOS: we keep the value in localDate; user Confirm to close
  const onIosChange = (_: DateTimePickerEvent, selected?: Date | undefined) => {
    if (selected) setLocalDate(selected);
  };

  if (Platform.OS === 'android') {
    // Render nothing when not visible. When visible and androidShow true, render DateTimePicker
    return visible && androidShow ? (
      <DateTimePicker
        value={localDate}
        mode="date"
        display="calendar" // Android will pick appropriate style
        onChange={onAndroidChange}
        minimumDate={minDate}
        maximumDate={maxDate}
      />
    ) : null;
  }

  // --- iOS Modal UI (calendar / spinner)
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <CustomText variant="title" style={styles.title}>
              {title}
            </CustomText>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() => onCancel()}
                style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
              >
                <Text style={styles.headerButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => onConfirm(localDate)}
                style={({ pressed }) => [styles.headerButtonPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.headerButtonPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={localDate}
              mode="date"
              display="inline" // iOS 14+ will show inline calendar; fallback gracefully
              onChange={onIosChange}
              minimumDate={minDate}
              maximumDate={maxDate}
              style={styles.iosPicker}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  sheet: {
    backgroundColor: colors.surfaceLight,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  headerButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  headerButtonPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerButtonPrimaryText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  pickerWrap: {
    paddingHorizontal: 0,
    paddingTop: 10,
    alignItems: 'center',
  },
  iosPicker: {
    width: '100%',
  },
  pressed: { opacity: 0.7 },
});

export default DatePicker;