import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

/**
 * Soft animated aurora blobs that drift behind GlassCards.
 * Reanimated drives the motion on the UI thread — no JS bridge work per frame.
 */
export function AuroraBackground({ intensity = 0.55 }: { intensity?: number }) {
  const { colors, mode } = useTheme();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [t]);

  const blob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -60 + t.value * 80 },
      { translateY: -40 + t.value * 60 },
      { scale: 1 + t.value * 0.15 },
    ],
  }));
  const blob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: 40 - t.value * 70 },
      { translateY: 60 - t.value * 40 },
      { scale: 1.1 - t.value * 0.1 },
    ],
  }));
  const blob3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -20 + t.value * 50 },
      { translateY: 80 + t.value * 30 },
      { scale: 0.95 + t.value * 0.2 },
    ],
  }));

  if (mode === 'amoled') return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', inset: 0, opacity: intensity, overflow: 'hidden' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -120,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: 360,
            backgroundColor: colors.accentViolet,
          },
          blob1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 60,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 320,
            backgroundColor: colors.accentPink,
          },
          blob2,
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: -100,
            left: 40,
            width: 380,
            height: 380,
            borderRadius: 380,
            backgroundColor: colors.accentBlue,
          },
          blob3,
        ]}
      />
    </View>
  );
}
