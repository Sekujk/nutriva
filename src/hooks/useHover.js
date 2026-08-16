import { useState } from 'react';
import { Platform } from 'react-native';

export default function useHover() {
  const [hovered, setHovered] = useState(false);

  if (Platform.OS !== 'web') {
    return { hovered: false, hoverHandlers: {} };
  }

  return {
    hovered,
    hoverHandlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
  };
}
