import { View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { cssInterop } from 'nativewind';
import { useTheme } from '@/hooks/useTheme';

cssInterop(BlurView, { className: 'style' });

type Props = ViewProps & {
  intensity?: number;
  bordered?: boolean;
};

/**
 * Frosted glass surface — pairs with AuroraBackground for the signature look.
 * On AMOLED we drop the blur and use a solid elevated surface so OLED panels
 * stay true-black behind the card edges.
 */
export function GlassCard({
  children,
  intensity = 40,
  bordered = true,
  className,
  ...rest
}: Props) {
  const { mode } = useTheme();
  const borderCls = bordered ? 'border border-border' : '';

  if (mode === 'amoled') {
    return (
      <View
        className={`bg-surface-elevated rounded-3xl ${borderCls} ${className ?? ''}`}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={mode === 'dark' ? 'dark' : 'light'}
      className={`overflow-hidden rounded-3xl ${borderCls} ${className ?? ''}`}
      {...rest}
    >
      <View className="bg-surface-frosted">
        {children}
      </View>
    </BlurView>
  );
}
