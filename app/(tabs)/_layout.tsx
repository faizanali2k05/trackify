import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Wallet, Receipt, Sparkles, Settings as Cog } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const { mode, colors } = useTheme();
  const { t } = useTranslation();

  const activeTint = colors.accentViolet;
  const inactiveTint = colors.textSubtle;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 24 : 16,
          height: 68,
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: mode === 'amoled' ? colors.bgElevated : 'transparent',
          elevation: 0,
          shadowColor: '#000',
          shadowOpacity: mode === 'light' ? 0.08 : 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarBackground: () =>
          mode === 'amoled' ? null : (
            <BlurView
              intensity={60}
              tint={mode === 'dark' ? 'dark' : 'light'}
              style={{
                flex: 1,
                borderRadius: 28,
                overflow: 'hidden',
                backgroundColor: colors.surfaceFrosted,
              }}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color }: { color: string }) => <Home size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t('tabs.budgets'),
          tabBarIcon: ({ color }: { color: string }) => <Wallet size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t('tabs.expenses'),
          tabBarIcon: ({ color }: { color: string }) => <Receipt size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: t('tabs.copilot'),
          tabBarIcon: ({ color }: { color: string }) => <Sparkles size={22} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }: { color: string }) => <Cog size={22} color={color} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
