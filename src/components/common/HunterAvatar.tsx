import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect, G } from 'react-native-svg';
import { COLORS } from '../../theme';

export interface HunterAvatarProps {
  size?: number;
  avatarId?: string;
  borderColor?: string;
}

export const AVATAR_OPTIONS: { id: string; name: string; desc: string }[] = [
  { id: 'monarch', name: 'Monarch Corona', desc: 'Luminous monarch shadow presence' },
  { id: 'cyber', name: 'System Visor', desc: 'Tactical holographic hunter HUD' },
  { id: 'daggers', name: 'Dual Fangs', desc: 'Twin daggers of the shadow assassin' },
  { id: 'shadow', name: 'Extraction Core', desc: 'Dark mana vortex of resurrection' },
  { id: 'shield', name: 'Aegis Barrier', desc: 'Reinforced hunter vanguard crest' },
];

export const HunterAvatar: React.FC<HunterAvatarProps> = ({
  size = 56,
  avatarId = 'monarch',
  borderColor = COLORS.c1,
}) => {
  const renderAvatarContent = () => {
    switch (avatarId) {
      case 'cyber':
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            {/* Dark background silhouette */}
            <Circle cx="28" cy="22" r="10" fill="#0f263d" />
            <Path d="M10 54c3-14 11-20 18-20s15 6 18 20z" fill="#0f263d" />
            {/* Cyber Visor */}
            <Rect x="18" y="20" width="20" height="4" rx="2" fill={COLORS.c1} />
            <Circle cx="28" cy="22" r="1.5" fill="#ffffff" />
            {/* Tech HUD crosshairs */}
            <Path d="M14 22h2M40 22h2M28 8v3M28 33v3" stroke={COLORS.c2} strokeWidth="1.5" />
          </Svg>
        );

      case 'daggers':
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            {/* Shadow Base */}
            <Circle cx="28" cy="28" r="22" fill="#0b1a29" />
            {/* Left Dagger */}
            <Path d="M18 12l8 16-6 4-6-16z" fill={COLORS.c2} opacity="0.9" />
            <Path d="M16 32l-4 8 2 2 8-4z" fill="#12304a" />
            {/* Right Dagger */}
            <Path d="M38 12l-8 16 6 4 6-16z" fill={COLORS.c1} opacity="0.9" />
            <Path d="M40 32l4 8-2 2-8-4z" fill="#12304a" />
            {/* Central Mana Spark */}
            <Circle cx="28" cy="28" r="3" fill="#ffffff" />
          </Svg>
        );

      case 'shadow':
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            {/* Dark Void Core */}
            <Circle cx="28" cy="28" r="20" fill="#07111c" stroke="#12304a" strokeWidth="2" />
            {/* Swirling Mana Arms */}
            <Path
              d="M28 14c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z"
              stroke={COLORS.c2}
              strokeWidth="1.5"
              strokeDasharray="4, 4"
              fill="none"
            />
            <Polygon points="28,16 34,28 28,40 22,28" fill={COLORS.c1} opacity="0.8" />
            <Circle cx="28" cy="28" r="4" fill="#ffffff" />
          </Svg>
        );

      case 'shield':
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            {/* Vanguard Crest */}
            <Path
              d="M28 8l16 8v16c0 12-16 18-16 18s-16-6-16-18V16z"
              fill="#0d2136"
              stroke={COLORS.c1}
              strokeWidth="2"
            />
            {/* Inner Emblem */}
            <Path
              d="M28 16l10 5v11c0 8-10 12-10 12s-10-4-10-12V21z"
              fill="rgba(57, 191, 255, 0.2)"
            />
            <Circle cx="28" cy="28" r="3.5" fill={COLORS.c2} />
          </Svg>
        );

      case 'monarch':
      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Circle cx="28" cy="21" r="10" fill="#12304a" />
            <Path d="M8 56c2-16 10-22 20-22s18 6 20 22z" fill="#12304a" />
            {/* Glowing Monarch Cyan Eyes */}
            <Circle cx="25" cy="21" r="1.5" fill={COLORS.c2} />
            <Circle cx="31" cy="21" r="1.5" fill={COLORS.c2} />
            {/* Crown Peak Accent */}
            <Polygon points="28,7 24,14 32,14" fill={COLORS.c1} />
          </Svg>
        );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size, borderColor }]}>
      {renderAvatarContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    backgroundColor: '#08121e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
