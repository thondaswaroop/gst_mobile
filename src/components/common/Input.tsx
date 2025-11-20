// src/components/Input.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, CustomIcon, CustomText, fonts } from '../../utils/libraryAssets';

interface FancyInputProps extends TextInputProps {
  label: string;
  iconName?: string;
  error?: string;
  // new customization props to allow inline layout / width control
  containerStyle?: ViewStyle;
  gradientStyle?: ViewStyle;
  innerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const Input: React.FC<FancyInputProps> = ({
  label,
  iconName = '',
  error,
  containerStyle,
  gradientStyle,
  innerStyle,
  labelStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState(props.value || '');

  // Animation for floating label
  const labelAnim = useRef(new Animated.Value(text ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || !!text ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, text]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Gradient border wrapper */}
      <LinearGradient
        colors={isFocused ? [colors.primary, '#9b59b6'] : ['#E6E6E6', '#E6E6E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientBorder, gradientStyle, error && styles.errorBorder]}
      >
        <View style={[styles.inner, innerStyle]}>
          {iconName ? (
            <CustomIcon
              iconName={iconName}
              size={20}
              color={isFocused ? colors.primary : colors.lightTextSecondary}
              style={styles.icon}
            />
          ) : null}

          <TextInput
            {...props}
            value={text}
            onChangeText={(val) => {
              setText(val);
              props.onChangeText && props.onChangeText(val);
            }}
            style={[styles.input, props.style]}
            placeholder=""
            placeholderTextColor={colors.lightTextSecondary}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            underlineColorAndroid="transparent"
          />

          {/* Floating Label */}
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.label,
              {
                top: labelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, -10],
                }),
                fontSize: labelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 12],
                }),
                color: error ? colors.error : isFocused ? colors.primary : colors.lightTextSecondary,
              },
              labelStyle,
            ]}
          >
            <CustomText variant='small'>{label}</CustomText>
          </Animated.Text>
        </View>
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  gradientBorder: {
    borderRadius: 12,
    padding: 2,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.lightTextPrimary,
    paddingVertical: 0,
  },
  label: {
    position: 'absolute',
    left: 40,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  icon: {
    marginRight: 8,
  },
  errorBorder: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
