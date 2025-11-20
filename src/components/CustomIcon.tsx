import React from 'react'
import { StyleProp } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    iconName: string,
    color?: string,
    size: string | number,
    style?: StyleProp<any>,
}

const CustomIcon: React.FC<Props> = ({
    iconName = '',
    color = '#fff',
    size = '24',
    style,
}) => {
    return (
        <>
            <Icon name={iconName} size={size} color={color} style={style} />
        </>
    )
}

export default CustomIcon