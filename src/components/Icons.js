// ============ ICONS ============
// SVG icons ported verbatim from the design's inline <svg> paths.

import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

// ▲ Ascend / play arrow
export function IconArrowUp({ size = 20, color = '#08233C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4l7 8h-4v7H9v-7H5l7-8z" fill={color} />
    </Svg>
  );
}

// Trophy / personal-best mark (chunky arrow used on Home best card)
export function IconBest({ size = 44, color = '#F2B33D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l8 9h-4.5v8h-7v-8H4l8-9z" fill={color} opacity={0.92} />
    </Svg>
  );
}

export function IconStar({ size = 13, color = '#F2B33D' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1 3-6z" fill={color} />
    </Svg>
  );
}

export function IconRanks({ size = 21, color = '#0F1A2B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="12" width="4" height="7" rx="1" fill={color} />
      <Rect x="10" y="7" width="4" height="12" rx="1" fill={color} />
      <Rect x="16" y="10" width="4" height="9" rx="1" fill={color} />
    </Svg>
  );
}

export function IconSkins({ size = 21, color = '#0F1A2B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7" fill={color} />
      <Circle cx="9.6" cy="9.6" r="2" fill="#fff" opacity={0.8} />
    </Svg>
  );
}

export function IconSettings({ size = 21, color = '#0F1A2B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth={2} />
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconRevive({ size = 16, color = '#0F1A2B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11h4l2-5 4 12 2-7h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconCheck({ size = 16, color = '#4FE0B0' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4 10-11" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLock({ size = 11, color = 'rgba(15,26,43,0.40)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="9" rx="2" fill={color} />
      <Path d="M8 11V8a4 4 0 018 0v3" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function IconClose({ size = 16, color = '#0F1A2B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
