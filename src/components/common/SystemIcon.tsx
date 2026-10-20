import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../theme';

export type IconName = 'dash' | 'quests' | 'lib' | 'status' | 'more' | 'bell' | 'check';

interface SystemIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const SystemIcon: React.FC<SystemIconProps> = ({
  name,
  size = 22,
  color = COLORS.c1,
  strokeWidth = 1.6,
}) => {
  switch (name) {
    case 'dash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
          <Path d="M3 3h8v8H3zM13 3h8v5h-8zM13 11h8v10h-8zM3 14h8v7H3z" />
        </Svg>
      );
    case 'quests':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
          <Path d="M6 3h12v18l-6-3-6 3z" />
          <Path d="M9 8h6M9 12h6" />
        </Svg>
      );
    case 'lib':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
          <Path d="M2 9v6M5 6v12M19 6v12M22 9v6M5 12h14" />
        </Svg>
      );
    case 'status':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
        </Svg>
      );
    case 'more':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
          <Circle cx="5" cy="12" r="1.5" fill={color} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
          <Circle cx="19" cy="12" r="1.5" fill={color} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square">
          <Path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth + 0.6} strokeLinecap="square" strokeLinejoin="miter">
          <Path d="M5 13l4 4L19 7" />
        </Svg>
      );
    default:
      return null;
  }
};
