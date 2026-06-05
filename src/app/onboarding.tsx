import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { Screen, Text, Button, AuroraBackground } from '@/components/ui';
import { useSettingsStore } from '@/store/settings';
import { useTheme } from '@/hooks/useTheme';

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const complete = useSettingsStore((s) => s.completeOnboarding);
  const { colors } = useTheme();

  function start() {
    complete();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <AuroraBackground intensity={0.7} />
      <View className="flex-1 justify-end pb-12">
        <Animated.View entering={FadeIn.delay(120).duration(700)}>
          <View
            className="self-start rounded-full px-3 py-1.5 mb-6"
            style={{ backgroundColor: colors.accentViolet + '22' }}
          >
            <Text variant="caption" style={{ color: colors.accentViolet }}>
              {t('app.name').toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(700)}>
          <Text variant="display" className="leading-tight">
            {t('onboarding.welcome_title')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(700)}>
          <Text variant="body" muted className="mt-4 text-lg">
            {t('onboarding.welcome_subtitle')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(540).duration(700)} className="mt-10">
          <Button
            label={t('onboarding.cta')}
            size="lg"
            icon={<ArrowRight size={18} color={colors.bg} strokeWidth={2.4} />}
            onPress={start}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}
