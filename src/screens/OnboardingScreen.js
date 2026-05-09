import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
} from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { setupNotifications } from '../utils/notifications';
import { spacing, radius, typography } from '../constants/theme';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon:    'flash',
    titleEn: 'Welcome to Intizom',
    titleUz: 'Intizomga xush kelibsiz',
    descEn:  'Build real daily discipline.\nPlan your tasks, focus deeply,\ntrack your progress.',
    descUz:  'Haqiqiy kunlik intizom quring.\nVazifalarni rejalashtiring,\nchuqur diqqat qiling.',
  },
  {
    icon:    'timer',
    titleEn: 'Focus Sessions',
    titleUz: 'Fokus sessiyalari',
    descEn:  'Start a task — a countdown timer\nkeeps you on track. Breaks are\nautomatically scheduled.',
    descUz:  'Tasni boshlang — taymer\nsizni yo\'lda ushlab turadi.\nTanaffuslar avtomatik belgilanadi.',
  },
  {
    icon:    'notifications',
    titleEn: 'Stay Notified',
    titleUz: 'Xabardor bo\'lib turing',
    descEn:  'Get alerts when it\'s time\nto start your next task.\nNever lose focus again.',
    descUz:  'Keyingi vazifa vaqti kelganda\nbildirishnoma oling.\nDiqqatni hech qachon yo\'qotmang.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme }  = useTheme();
  const updateSettings = useStore(s => s.updateSettings);

  const [step,     setStep]     = useState(0);
  const [language, setLanguage] = useState('en');
  const [loading,  setLoading]  = useState(false);

  const slideX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ opacity: 1 }));

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;

  const goNext = async () => {
    if (!isLast) {
      setStep(s => s + 1);
      return;
    }
    // Finish onboarding
    setLoading(true);
    try {
      await setupNotifications();
      await updateSettings({ language, hasOnboarded: true });
      // Navigator will re-render and show Main
    } catch {
      await updateSettings({ language, hasOnboarded: true });
    }
    setLoading(false);
  };

  const accentColor = theme.accent;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      {/* Language picker — only on first step */}
      {isFirst && (
        <View style={styles.langRow}>
          {['en', 'uz'].map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => setLanguage(l)}
              style={[
                styles.langBtn,
                {
                  backgroundColor: language === l ? accentColor : theme.cardElevated,
                  borderColor:     language === l ? accentColor : theme.cardBorder,
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{l === 'en' ? '🇬🇧' : '🇺🇿'}</Text>
              <Text style={[typography.smallMed, { color: language === l ? '#fff' : theme.textSecondary, marginLeft: 6 }]}>
                {l === 'en' ? 'English' : 'O\'zbek'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Icon */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
          <Ionicons name={current.icon} size={64} color={accentColor} />
        </View>
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={[typography.h2, { color: theme.text, textAlign: 'center', marginBottom: 16 }]}>
          {language === 'uz' ? current.titleUz : current.titleEn}
        </Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', lineHeight: 26 }]}>
          {language === 'uz' ? current.descUz : current.descEn}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === step ? accentColor : theme.cardBorder,
                width:           i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {!isFirst && (
          <TouchableOpacity
            onPress={() => setStep(s => s - 1)}
            style={[styles.backBtn, { borderColor: theme.cardBorder }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={goNext}
          disabled={loading}
          style={[styles.nextBtn, { backgroundColor: accentColor, flex: isFirst ? 1 : undefined }]}
        >
          {loading ? (
            <Text style={[typography.bodyMed, { color: '#fff' }]}>...</Text>
          ) : (
            <View style={styles.nextInner}>
              <Text style={[typography.bodyMed, { color: '#fff' }]}>
                {isLast
                  ? (language === 'uz' ? 'Boshlash 🚀' : 'Let\'s Go 🚀')
                  : (language === 'uz' ? 'Davom' : 'Next')}
              </Text>
              {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  langRow:   { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  langBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  iconWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle:{ width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  textWrap:  { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  dots:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
  dot:       { height: 8, borderRadius: 4 },
  buttons:   { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  backBtn:   { width: 52, height: 52, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextBtn:   { height: 52, paddingHorizontal: spacing.xl, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
  nextInner: { flexDirection: 'row', alignItems: 'center' },
});
