import * as LucideIcons from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';

type Props = LucideProps & { name: string };

/**
 * Renders a lucide icon by name so data (categories, budget types) can reference
 * icons as plain strings. Falls back to a neutral circle for unknown names.
 */
export function Icon({ name, ...rest }: Props) {
  const map = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const Cmp = map[name] ?? LucideIcons.Circle;
  return <Cmp {...rest} />;
}
