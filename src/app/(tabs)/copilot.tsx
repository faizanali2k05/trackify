import { useCallback, useRef, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Screen, Text, GlassCard, AuroraBackground } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useExpensesStore } from '@/store/expenses';
import { useBudgetsStore } from '@/store/budgets';
import { useSettingsStore } from '@/store/settings';
import { streamAIResponse, uid, type AIMessage } from '@/services/ai';

export default function Copilot() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const h = useHaptics();
  const expenses = useExpensesStore((s) => s.expenses);
  const budgets = useBudgetsStore((s) => s.budgets);
  const locale = useSettingsStore((s) => s.locale);
  const currency = useSettingsStore((s) => s.currency);
  const userName = useSettingsStore((s) => s.userName);
  const grokApiKey = useSettingsStore((s) => s.grokApiKey);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? draft).trim();
      if (!content || streaming) return;
      h.light();

      const userMsg: AIMessage = {
        id: uid(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
      ]);
      setDraft('');
      setStreaming(true);

      try {
        for await (const chunk of streamAIResponse(content, {
          expenses,
          budgets,
          locale,
          currency,
          userName,
          apiKey: grokApiKey,
          history: messages,
        })) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m,
            ),
          );
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      } finally {
        setStreaming(false);
      }
    },
    [draft, streaming, expenses, budgets, locale, currency, userName, grokApiKey, messages, h],
  );

  const suggestions = [
    t('copilot.suggestions.s1'),
    t('copilot.suggestions.s2'),
    t('copilot.suggestions.s3'),
    t('copilot.suggestions.s4'),
  ];

  return (
    <Screen padded={false}>
      <AuroraBackground intensity={0.4} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        style={{ flex: 1 }}
      >
        <View className="px-5 pt-2">
          <View className="flex-row items-center gap-2">
            <Sparkles size={20} color={colors.accentPink} strokeWidth={2.4} />
            <Text variant="title">{t('copilot.title')}</Text>
          </View>
          <Text variant="body" muted className="mt-1">
            {t('copilot.subtitle')}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="gap-3">
              <Text variant="caption" muted className="uppercase tracking-wider">
                {t('copilot.suggestions.title')}
              </Text>
              {suggestions.map((s, i) => (
                <Animated.View key={i} entering={FadeInUp.delay(i * 80).duration(400)}>
                  <Pressable
                    onPress={() => send(s)}
                    className="rounded-2xl border border-border bg-surface px-4 py-3.5"
                  >
                    <Text variant="body">{s}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="gap-3">
              {messages.map((m) => (
                <Animated.View
                  key={m.id}
                  entering={FadeIn.duration(220)}
                  className={m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[90%]'}
                >
                  {m.role === 'user' ? (
                    <View
                      className="rounded-3xl rounded-tr-md px-4 py-3"
                      style={{ backgroundColor: colors.text }}
                    >
                      <Text variant="body" style={{ color: colors.bg }}>
                        {m.content}
                      </Text>
                    </View>
                  ) : (
                    <GlassCard className="px-4 py-3 rounded-tl-md">
                      <Text variant="body">
                        {m.content}
                        {streaming && m.content.length === 0 ? '…' : ''}
                      </Text>
                    </GlassCard>
                  )}
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>

        <View
          className="px-5 pb-28"
          style={{ borderTopWidth: 0 }}
        >
          <View
            className="flex-row items-end gap-2 rounded-3xl border border-border bg-surface px-4 py-3"
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('copilot.placeholder')}
              placeholderTextColor={colors.textSubtle}
              multiline
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                maxHeight: 96,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            />
            <Pressable
              onPress={() => send()}
              disabled={!draft.trim() || streaming}
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: draft.trim() && !streaming ? colors.accentViolet : colors.border,
              }}
            >
              <Send
                size={18}
                color={draft.trim() && !streaming ? colors.bg : colors.textSubtle}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
