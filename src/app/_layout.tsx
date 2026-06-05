import '../../global.css';
import '@/lib/i18n';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme, vars } from 'nativewind';
import { View } from 'react-native';

import { queryClient } from '@/lib/query';
import { useSettingsStore } from '@/store/settings';
import { useTheme } from '@/hooks/useTheme';
import { useOTAUpdates } from '@/hooks/useOTAUpdates';
import { semanticTokens } from '@/lib/theme';

function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  // For AMOLED we set true-black via inline vars on top of the dark scheme.
  const amoledVars =
    mode === 'amoled'
      ? vars({
          '--color-bg': '0 0 0',
          '--color-bg-elevated': '6 6 10',
          '--color-surface': '10 10 14',
        })
      : undefined;
  return (
    <View style={[{ flex: 1 }, amoledVars]}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {children}
    </View>
  );
}

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  useEffect(() => {
    const onOnboarding = segments[0] === 'onboarding';
    if (!hasOnboarded && !onOnboarding) {
      router.replace('/onboarding');
    } else if (hasOnboarded && onOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasOnboarded, segments, router]);

  return null;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  // Apply over-the-air updates (no-op in Expo Go / dev).
  useOTAUpdates();
  // Touch the scheme so Reanimated picks up the right palette on mount.
  useEffect(() => {
    void colorScheme;
  }, [colorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: semanticTokens.dark.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedRoot>
            <OnboardingGate />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="analytics" />
              <Stack.Screen name="expense/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="expense/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="budget/new" options={{ presentation: 'modal' }} />
              <Stack.Screen name="budget/[id]" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemedRoot>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
