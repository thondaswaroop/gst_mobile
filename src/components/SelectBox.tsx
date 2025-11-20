// src/components/SelectBox.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { CustomText, CustomIcon, colors, fonts } from '../utils/libraryAssets';
import { fontSizes, spacing } from '../styles/default';
import { globalStyles } from '../styles/globalStyles';

interface SelectBoxProps {
  label?: string;
  selectedValue: string;
  onValueChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

const SelectBox: React.FC<SelectBoxProps> = ({
  label,
  selectedValue,
  onValueChange,
  options,
  placeholder = 'Select an option',
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onValueChange(val);
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <CustomText variant="caption" style={globalStyles.mb10}>
          {label}
        </CustomText>
      )}
      <TouchableOpacity
        style={styles.box}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <CustomText
          variant="caption"
          style={{ color: selectedValue ? colors.darkText : colors.lightTextSecondary }}
        >
          {selectedValue || placeholder}
        </CustomText>
        <CustomIcon iconName="chevron-down" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Modal Popup */}
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TextInput
                placeholder="Search..."
                placeholderTextColor={colors.lightTextSecondary}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity onPress={() => setVisible(false)}>
                <CustomIcon iconName="close" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SelectBox;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  box: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.subtitleFont,
    fontSize: fontSizes.small,
    color: colors.darkText,
    marginRight: 8,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  optionText: {
    fontSize: fontSizes.small,
    color: colors.darkText,
    fontFamily: fonts.subtitleFont,
  },
});
