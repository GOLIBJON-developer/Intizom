import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useStore } from '../store/useStore';
import { selectNextTask } from '../store/selectors';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { getCategoryById } from '../constants/i18n';
import { spacing, radius, typography } from '../constants/theme';

const { width } = Dimensions.get('window');

// Safe speak — expo-speech doesn't always return a Promise
const safeSpeech = (text, opts) => {
  try { Speech.speak(text, opts); } catch {}
};

export default function AlertScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { theme }  = useTheme();
  const { t, language } = useI18n();

  const { taskId, completed } = route.params || {};
  const tasks        = useStore(s => s.tasks);
  const dailyLogs    = useStore(s => s.dailyLogs);
  const startSession = useStore(s => s.startSession);

  const nextTask = useMemo(() => selectNextTask(tasks, dailyLogs), [tasks, dailyLogs]);
  const task     = tasks.find(t => t.id === taskId);

  const displayTask  = nextTask || task;
  const displayColor = displayTask?.color || theme.accent;

  // Animations — use simple withTiming without Easing to avoid version issues
  const glow  = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pulse = useSharedValue(1);

  useEffect(() => {
    glow.value  = withRepeat(
      withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })),
      -1, false
    );
    scale.value = withTiming(1, { duration: 500 });
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1, false
    );
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    if (nextTask) {
      safeSpeech(
        language === 'uz' ? `Vaqt keldi: ${nextTask.name}` : `Time for: ${nextTask.name}`,
        { language: language === 'uz' ? 'uz-UZ' : 'en-US' }
      );
    }
  }, []);

  const glowStyle    = useAnimatedStyle(() => ({
    opacity:   interpolate(glow.value, [0, 1], [0.15, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.25]) }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pulseStyle   = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handleStart = () => {
    try { Speech.stop(); } catch {}
    if (nextTask) {
      startSession(nextTask.id);
      navigation.replace('FocusTimer', { taskId: nextTask.id });
    } else {
      navigation.navigate('Main');
    }
  };

  const handleSkip = () => {
    try { Speech.stop(); } catch {}
    navigation.navigate('Main');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Animated.View style={[styles.glowOuter, { backgroundColor: displayColor }, glowStyle]} />
      <Animated.View style={[styles.glowInner, { backgroundColor: displayColor }, glowStyle]} />
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.72)' }]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, contentStyle]}>

          {completed && task && (
            <View style={[styles.badge, { backgroundColor: theme.success + '25', borderColor: theme.success + '50' }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={[typography.smallMed, { color: theme.success, marginLeft: 6 }]}>
                {task.name} — Done!
              </Text>
            </View>
          )}

          <Animated.View style={pulseStyle}>
            <Text style={styles.bigIcon}>
              {displayTask ? getCategoryById(displayTask.category)?.icon : '⚡'}
            </Text>
          </Animated.View>

          <Text style={[styles.timeLabel, { color: displayColor + 'CC' }]}>
            {t.timeFor}
          </Text>

          <Text style={[styles.taskName, { color: '#fff' }]} numberOfLines={2}>
            {displayTask?.name || 'Next Task'}
          </Text>

          {displayTask && (
            <View style={[styles.durationRow, { backgroundColor: displayColor + '20', borderColor: displayColor + '40' }]}>
              <Ionicons name="time-outline" size={16} color={displayColor} />
              <Text style={[typography.timerSm, { color: displayColor, marginLeft: 6 }]}>
                {displayTask.duration}m
              </Text>
              {displayTask.breakAfter > 0 && (
                <Text style={[typography.timerSm, { color: '#888', marginLeft: 12 }]}>
                  ☕ +{displayTask.breakAfter}m
                </Text>
              )}
            </View>
          )}

          {!nextTask && (
            <View style={[styles.allDoneCard, { backgroundColor: theme.success + '20', borderColor: theme.success + '40' }]}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
              <Text style={[typography.title, { color: theme.success, textAlign: 'center' }]}>
                {t.allDone}
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={handleStart}
            style={[styles.startBtn, { backgroundColor: displayColor, shadowColor: displayColor }]}
            activeOpacity={0.85}>
            <View style={styles.startBtnInner}>
              <Ionicons name={nextTask ? 'rocket' : 'home'} size={22} color="#fff" />
              <Text style={styles.startBtnText}>
                {nextTask ? t.letsGo : 'Home'}
              </Text>
            </View>
          </TouchableOpacity>

          {nextTask && (
            <TouchableOpacity onPress={handleSkip}
              style={[styles.skipBtn, { borderColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[typography.bodyMed, { color: 'rgba(255,255,255,0.6)' }]}>
                {t.skipTask}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  glowOuter:    { position: 'absolute', width: width * 1.5, height: width * 1.5, borderRadius: width * 0.75, alignSelf: 'center', top: '8%' },
  glowInner:    { position: 'absolute', width: width * 0.75, height: width * 0.75, borderRadius: width * 0.375, alignSelf: 'center', top: '22%' },
  overlay:      { ...StyleSheet.absoluteFillObject },
  safe:         { flex: 1, justifyContent: 'center' },
  content:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  badge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, marginBottom: spacing.xl },
  bigIcon:      { fontSize: 72, marginBottom: spacing.md },
  timeLabel:    { fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm, fontFamily: 'DMSans_600SemiBold' },
  taskName:     { fontSize: 34, lineHeight: 42, fontFamily: 'DMSans_700Bold', textAlign: 'center', marginBottom: spacing.lg },
  durationRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, marginBottom: spacing.xl },
  allDoneCard:  { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', marginBottom: spacing.lg },
  buttons:      { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  startBtn:     { borderRadius: radius.lg, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  startBtnInner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  startBtnText: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: '#fff' },
  skipBtn:      { paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1 },
});
