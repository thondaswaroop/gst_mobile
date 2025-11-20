import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type Props = {
  source: any;                  // require() or { uri: string }
  width?: number | string;      // default: '100%'
  height?: number;              // default: 200
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  style?: StyleProp<ImageStyle>;
};

const AppImage: React.FC<Props> = ({
  source,
  width = '100%',
  height = 200,
  resizeMode = 'contain',
  style,
}) => {
  return (
    <Image
      source={source}
      style={[{ width: typeof width === 'number' ? width : parseFloat(width), height, resizeMode }, style]}
    />
  );
};

export default AppImage;
