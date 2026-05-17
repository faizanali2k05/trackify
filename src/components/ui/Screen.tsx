import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

cssInterop(SafeAreaView, { className: 'style' });

type Props = ViewProps & {
  edges?: readonly Edge[];
  scroll?: boolean;
  padded?: boolean;
};

/**
 * Base screen wrapper — handles safe-area, background token, and consistent padding.
 * Every screen should be wrapped in this rather than touching SafeAreaView directly.
 */
export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
  className,
  ...rest
}: Props) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-bg">
      <View className={`flex-1 ${padded ? 'px-5' : ''} ${className ?? ''}`} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
