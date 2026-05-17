import { Pressable, type PressableProps, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { useHaptics } from '@/hooks/useHaptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  haptic?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: 'bg-text',
  secondary: 'bg-surface-elevated border border-border',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const variantText: Record<Variant, string> = {
  primary: 'text-text-inverse',
  secondary: 'text-text',
  ghost: 'text-text',
  danger: 'text-text-inverse',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-4 py-2.5 rounded-2xl',
  md: 'px-5 py-3.5 rounded-2xl',
  lg: 'px-6 py-4 rounded-3xl',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  haptic = true,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const h = useHaptics();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 280 });
        }}
        onPress={(e) => {
          if (haptic) h.light();
          onPress?.(e);
        }}
        className={`${variantClass[variant]} ${sizeClass[size]} ${disabled ? 'opacity-50' : ''}`}
        {...rest}
      >
        <View className="flex-row items-center justify-center gap-2">
          {icon}
          <Text className={`${variantText[variant]} font-display text-base`}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
