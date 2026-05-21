import { View, TextInput, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/hooks/useTheme';

type Props = TextInputProps & {
  label?: string;
  prefix?: string;
};

/** Themed text input with an optional label and leading prefix (e.g. a currency symbol). */
export function TextField({ label, prefix, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      {label ? (
        <Text variant="caption" muted className="mb-2 uppercase tracking-wider">
          {label}
        </Text>
      ) : null}
      <View
        className="flex-row items-center rounded-2xl border border-border bg-surface px-4"
        style={{ minHeight: 54 }}
      >
        {prefix ? (
          <Text variant="body" muted className="mr-1.5">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textSubtle}
          style={[{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: 14 }, style]}
          {...rest}
        />
      </View>
    </View>
  );
}
