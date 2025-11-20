import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type KeyboardScrollViewProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
}>;

const KeyboardScrollView: React.FC<KeyboardScrollViewProps> = ({
  children,
  contentContainerStyle,
  bottomPadding = 80,
}) => {
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[{ flexGrow: 1, paddingBottom: bottomPadding }, contentContainerStyle]}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={Platform.OS === 'ios' ? 30 : 60}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export default KeyboardScrollView;
