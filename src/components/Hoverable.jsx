import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import useHover from '../hooks/useHover';

// scaleTo controla el "crecimiento" al pasar el mouse (web/desktop).
// pressScaleTo es opcional: si se usa, el elemento interior puede pasar
// `pressHandlers` (onPressIn/onPressOut) a su Touchable para que también
// reaccione al toque en móvil, no solo al hover.
export default function Hoverable({ children, scaleTo = 1.03, pressScaleTo, style }) {
  const { hovered, hoverHandlers } = useHover();
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let target = 1;
    if (pressed) target = pressScaleTo ?? Math.max(0.94, 2 - scaleTo);
    else if (hovered) target = scaleTo;

    Animated.spring(scale, {
      toValue: target,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [hovered, pressed]);

  const pressHandlers = {
    onPressIn: () => setPressed(true),
    onPressOut: () => setPressed(false),
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]} {...hoverHandlers}>
      {typeof children === 'function' ? children({ hovered, pressed, pressHandlers }) : children}
    </Animated.View>
  );
}
