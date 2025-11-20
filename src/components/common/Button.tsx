import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { CustomText, colors } from '../../utils/libraryAssets';
import { spacing, fontSizes } from '../../styles/default';

type ButtonSize = 'small' | 'medium' | 'large' | 'custom';

type Props = {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  size?: ButtonSize;
  style?: ViewStyle;
};

const Button: React.FC<Props> = ({
  title,
  onPress,
  fullWidth = true,
  size = 'medium',
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        fullWidth && { alignSelf: 'stretch' },
        sizeStyles[size],
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <CustomText variant='buttonText' style={[styles.text, textSize[size]]}>{title}</CustomText>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

// 🔹 Size variations
const sizeStyles: Record<ButtonSize, ViewStyle> = {
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  custom: {
    paddingVertical: spacing.sml,
    paddingHorizontal: spacing.lg,
  }
};

// 🔹 Text size variations
const textSize = {
  small: { fontSize: fontSizes.small },
  medium: { fontSize: fontSizes.medium },
  large: { fontSize: fontSizes.large },
  custom: {}
};
