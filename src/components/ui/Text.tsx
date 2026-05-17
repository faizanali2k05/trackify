import { Text as RNText, type TextProps } from 'react-native';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'callout'
  | 'caption'
  | 'mono';

const variantClass: Record<Variant, string> = {
  display: 'font-display text-5xl tracking-tight text-text',
  title: 'font-display text-3xl tracking-tight text-text',
  heading: 'font-display text-xl text-text',
  body: 'font-sans text-base text-text',
  callout: 'font-sans text-sm text-text-muted',
  caption: 'font-sans text-xs text-text-subtle',
  mono: 'font-mono text-base text-text',
};

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function Text({ variant = 'body', muted, className, ...rest }: Props) {
  return (
    <RNText
      className={`${variantClass[variant]} ${muted ? 'text-text-muted' : ''} ${className ?? ''}`}
      {...rest}
    />
  );
}
