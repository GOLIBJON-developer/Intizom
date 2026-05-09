import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { CircularTimer } from '../components/CircularTimer';
import { ThemedText } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';
import { getCategoryById } from '../constants/i18n';
import { showTaskComplete, dismissAll } from '../utils/notifications';

const safeHaptic = (fn) => { try { fn(); } catch {} };

// Speak with language fallback — Uzbek TTS not available on all devices
const safeSpeech = async (text, opts = {}) => {
  try {
    const lang = opts.language || 'en-US';
    if (lang === 'uz-UZ') {
      // Check if Uzbek voices are available
      const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
      const hasUz  = voices.some(v => v.language?.startsWith('uz'));
      if (!hasUz) {
        // Fall back to English
        Speech.speak(text, { ...opts, language: 'en-US' });
        return;
      }
    }
    Speech.speak(text, opts);
  } catch {}
};

export default function FocusTimerScreen() {
  const navigation  = useNavigation();
  const route       = useRoute();
  const { theme }   = useTheme();
  const { t, language } = useI18n();

  const taskId          = route.params?.taskId;
  const tasks           = useStore(s => s.tasks);
  const settings        = useStore(s => s.settings);
  const activeSession   = useStore(s => s.activeSession);
  const pauseSession    = useStore(s => s.pauseSession);
  const resumeSession   = useStore(s => s.resumeSession);
  const completeSession = useStore(s => s.completeSession);
  const skipSession     = useStore(s => s.skipSession);
  const startSession    = useStore(s => s.startSession);
  const addNote         = useStore(s => s.addNote);

  const task     = tasks.find(t => t.id === taskId);
  const category = task ? getCategoryById(task.category) : null;

  const [remaining,     setRemaining]     = useState(0);
  const [total,         setTotal]         = useState(0);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText,      setNoteText]      = useState('');
  const intervalRef   = useRef(null);
  const appStateRef   = useRef(AppState.currentState);

  // TODO 6: When app comes back from background, recalculate remaining
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        // Force re-read remaining from endTime (already done in getRemaining)
        const rem = getRemaining();
        setRemaining(rem);
        if (rem <= 0) {
          clearInterval(intervalRef.current);
          handleTimerEnd();
        }
      }
    });
    return () => sub.remove();
  }, [activeSession]);

  const voiceLang = settings?.voiceLanguage || 'en-US';

  const getRemaining = useCallback(() => {
    if (!activeSession) return 0;
    if (activeSession.isPaused)
      return Math.max(0, Math.floor((activeSession.endTime - activeSession.pausedAt) / 1000));
    return Math.max(0, Math.floor((activeSession.endTime - Date.now()) / 1000));
  }, [activeSession]);

  useEffect(() => {
    if (!task) return;
    const dur = activeSession?.isBreak ? (task.breakAfter || 10) : task.duration;
    setTotal(dur * 60);
    activateKeepAwakeAsync();
    return () => deactivateKeepAwake();
  }, [task?.id]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const rem = getRemaining();
      setRemaining(rem);
      if (rem === 0) {
        clearInterval(intervalRef.current);
        safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        handleTimerEnd();
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeSession]);

  const handleTimerEnd = async () => {
    const wasBreak = activeSession?.isBreak;
    await completeSession();
    await dismissAll();

    if (!wasBreak && (task?.breakAfter || 0) > 0) {
      // Task done → start break immediately
      await showTaskComplete({ taskName: task.name, language });
      startSession(task.id, true);
      safeSpeech(
        voiceLang === 'uz-UZ'
          ? `${task.name} tugadi. ${task.breakAfter} daqiqa tanaffus!`
          : `${task.name} done! ${task.breakAfter} minute break starting.`,
        { language: voiceLang }
      );
    } else if (wasBreak) {
      // Break done → show Alert with NEXT task
      safeSpeech(
        voiceLang === 'uz-UZ'
          ? "Tanaffus tugadi. Keyingi vazifaga o'ting!"
          : 'Break over! Time for the next task.',
        { language: voiceLang }
      );
      navigation.replace('Alert', { taskId: task?.id, completed: false, isBreakEnd: true });
    } else {
      // Task done, no break → show Alert with next task
      await showTaskComplete({ taskName: task.name, language });
      safeSpeech(
        voiceLang === 'uz-UZ'
          ? "Ajoyib! Keyingisiga o'ting."
          : 'Great work! Moving to next task.',
        { language: voiceLang }
      );
      navigation.replace('Alert', { taskId: task?.id, completed: true });
    }
  };

  const handlePauseResume = () => {
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    if (activeSession?.isPaused) resumeSession();
    else pauseSession();
  };

  const handleDone = async () => {
    clearInterval(intervalRef.current);
    if (task) await showTaskComplete({ taskName: task.name, language });
    await completeSession();
    await dismissAll();
    navigation.replace('Alert', { taskId: task?.id, completed: true });
  };

  const handleSkip = async () => {
    clearInterval(intervalRef.current);
    await skipSession();
    await dismissAll();
    navigation.goBack();
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    await addNote({ taskId: task.id, text: noteText.trim() });
    setNoteText('');
    setShowNoteModal(false);
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  };

  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText>Task not found</ThemedText>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.accentLight }}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isBreak   = activeSession?.isBreak;
  const isPaused  = activeSession?.isPaused;
  const taskColor = isBreak ? '#6B7280' : (task.color || theme.accent);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip}
          style={[styles.topBtn, { backgroundColor: theme.cardElevated }]}>
          <Ionicons name="close" size={15} color={theme.textSecondary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>{t.skip}</Text>
        </TouchableOpacity>

        <View style={[styles.sessionBadge, { backgroundColor: taskColor + '20', borderColor: taskColor + '40' }]}>
          <Ionicons name={isBreak ? 'cafe' : 'flash'} size={13} color={taskColor} />
          <Text style={[typography.caption, { color: taskColor, marginLeft: 4 }]}>
            {isBreak ? (language === 'uz' ? 'Tanaffus' : 'Break') : (language === 'uz' ? 'Fokus' : 'Focus')}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowNoteModal(true)}
          style={[styles.topBtn, { backgroundColor: theme.cardElevated }]}>
          <Ionicons name="create-outline" size={15} color={theme.textSecondary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
            {language === 'uz' ? 'Eslatma' : 'Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task info */}
      <View style={styles.taskInfo}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{category?.icon}</Text>
        <ThemedText variant="h3" style={{ textAlign: 'center' }} numberOfLines={2}>{task.name}</ThemedText>
        {isBreak && <ThemedText secondary style={{ marginTop: 4 }}>{t.breakTime}</ThemedText>}
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <CircularTimer
          totalSeconds={total} remainingSeconds={remaining}
          color={taskColor} isPaused={isPaused}
          label={isBreak ? t.breakTime : t.focusTime}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePauseResume}
          style={[styles.controlBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color={taskColor} />
          <Text style={[typography.smallMed, { color: theme.textSecondary, marginTop: 6 }]}>
            {isPaused ? t.resume : t.pause}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDone}
          style={[styles.doneBtn, { backgroundColor: taskColor, shadowColor: taskColor }]}>
          <Ionicons name="checkmark" size={36} color="#fff" />
          <Text style={[typography.bodyMed, { color: '#fff', marginTop: 4 }]}>{t.done}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowNoteModal(true)}
          style={[styles.controlBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Ionicons name="document-text-outline" size={26} color={theme.accentLight} />
          <Text style={[typography.smallMed, { color: theme.textSecondary, marginTop: 6 }]}>
            {language === 'uz' ? 'Eslatma' : 'Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal visible={showNoteModal} animationType="slide" transparent onRequestClose={() => setShowNoteModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="title">{t.addNote}</ThemedText>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.noteInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder }]}
              placeholder={t.typeNote} placeholderTextColor={theme.textMuted}
              value={noteText} onChangeText={setNoteText}
              multiline autoFocus maxLength={500}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}
                style={[styles.modalBtn, { backgroundColor: theme.cardElevated }]}>
                <Text style={{ color: theme.textSecondary, ...typography.bodyMed }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNote} disabled={!noteText.trim()}
                style={[styles.modalBtn, { backgroundColor: taskColor, opacity: noteText.trim() ? 1 : 0.5 }]}>
                <Text style={{ color: '#fff', ...typography.bodyMed }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  topBtn:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  taskInfo:     { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.lg },
  controlBtn:   { width: 80, height: 80, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  doneBtn:      { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, padding: spacing.lg },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  noteInput:    { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.md, fontSize: 15, lineHeight: 22 },
  modalBtns:    { flexDirection: 'row', gap: spacing.sm },
  modalBtn:     { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});