import React, { PropsWithChildren } from 'react';
import { View, ImageBackground, StyleSheet, StyleProp, ViewStyle, StatusBar } from 'react-native';
import { Images } from '../../utils/resources';
import globalStyles from '../../styles/globalStyles';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../constants/colors';

type AuthContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  overlayColor?: string;
}>;

const AuthContainer: React.FC<AuthContainerProps> = ({
  children,
  style,
  overlayColor = 'rgba(10,46,117,0.45)',
}) => {
  return (
    <LinearGradient colors={colors.gradientPrimary} style={globalStyles.flex}>
      <SafeAreaView style={globalStyles.flex}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <View style={[styles.overlay, { backgroundColor: overlayColor }]} pointerEvents="none" />
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
});

export default AuthContainer;
