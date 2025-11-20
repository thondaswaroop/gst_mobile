// src/components/Text.tsx
import React from 'react';
import { Text as RNText, StyleSheet, TextProps, TextStyle } from 'react-native';
import { colors, fonts } from '../../utils/libraryAssets';

type Variant =
  | 'designTitle'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'link'
  | 'small'
  | 'xSmall'
  | 'xsSmall'
  | 'medium'
  | 'buttonText'
  | 'small_hand'
  | 'boldCaption';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface Props extends TextProps {
  children: React.ReactNode;
  variant?: Variant;
  weight?: Weight;
  color?: string;
  style?: TextStyle | TextStyle[];
}

const CustomText = ({
  children,
  variant = 'body',
  weight = 'regular',
  color = colors.textPrimary,
  style,
  ...rest
}: Props) => {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        fontWeightStyles[weight],
        { color },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.interRegular,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

const variantStyles: Record<Variant, TextStyle> = {
  heading: {
    fontSize: 36,
    fontFamily: fonts.poppinsBold,
    lineHeight: 44,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.poppinsSemiBold,
    lineHeight: 34,
  },
  designTitle: {
    fontSize: 26,
    fontFamily: fonts.freeRoyality,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: fonts.poppinsMedium,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontFamily: fonts.interRegular,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontFamily: fonts.freeRoyality,
    lineHeight: 20,
  },
  boldCaption: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    color: colors.primary,
  },
  buttonText:{
    fontSize: 15,
    fontFamily: fonts.poppinsBold,
    color: colors.primary,
  },
  medium: {
    fontSize: 15,
    fontFamily: fonts.interMedium,
  },
  small: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  xSmall: {
    fontSize: 11,
    fontFamily: fonts.interRegular,
  },
  small_hand: {
    fontSize: 13,
    fontFamily: fonts.AnnieUseYourTelescope,
  },
  xsSmall: {
    fontSize: 9,
    fontFamily: fonts.interRegular,
  },
};

const fontWeightStyles: Record<Weight, TextStyle> = {
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
};

export default CustomText;
