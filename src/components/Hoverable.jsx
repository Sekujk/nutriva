import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import useHover from '../hooks/useHover';

export default function Hoverable({ children, scaleTo = 1.03, style }) {
  const { hovered, hoverHandlers } = useHover();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: hovered ? scaleTo : 1,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [hovered]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]} {...hoverHandlers}>
      {typeof children === 'function' ? children({ hovered }) : children}
    </Animated.View>
  );
}
