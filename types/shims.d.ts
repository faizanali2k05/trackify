// Some Expo SDK 52 installs of react-native-gesture-handler ship without their
// bundled .d.ts files. We only use GestureHandlerRootView at the moment, so a
// thin module declaration is enough to make tsc happy.
declare module 'react-native-gesture-handler' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export const GestureHandlerRootView: ComponentType<ViewProps>;

  const anyExport: any;
  export default anyExport;
}
