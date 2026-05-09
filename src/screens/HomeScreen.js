import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { selectTodayProgress, selectNextTask } from '../store/selectors';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { spacing, radius, typography } from '../constants/theme';
import { ThemedView, ThemedText, ProgressBar } from '../components/UI';
import { getCategoryById } from '../constants/i18n';

const formatDuration = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { theme }  = useTheme();
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const tasks         = useStore(s => s.tasks);
  const streak        = useStore(s => s.streak);
  const activeSession = useStore(s => s.activeSession);
  const dailyLogs     = useStore(s => s.dailyLogs);
  const settings      = useStore(s => s.settings);
  const loadData      = useStore(s => s.loadData);
  const startSession  = useStore(s => s.startSession);

  // Computed — useMemo prevents infinite loops
  const progress = useMemo(() => selectTodayProgress(tasks, dailyLogs), [tasks, dailyLogs]);
  const nextTask = useMemo(() => selectNextTask(tasks, dailyLogs), [tasks, dailyLogs]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const log = dailyLogs[todayKey] || { completed: [], skipped: [] };
  const activeTask = activeSession ? tasks.find(t => t.id === activeSession.taskId) : null;
  const pct = progress.total > 0 ? progress.completed / progress.total : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStart = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    startSession(taskId);
    if (task && settings?.notificationsEnabled !== false) {
      const { showTaskAlert } = require('../utils/notifications');
      showTaskAlert({ taskName: task.name, duration: task.duration, language: settings?.language });
    }
    navigation.navigate('FocusTimer', { taskId });
  };

  const greetKey = `good${greeting()}`;
  const greetText = t[greetKey] || t.goodMorning;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="h2">{greetText} 👋</ThemedText>
            <ThemedText secondary style={{ marginTop: 2 }}>{format(new Date(), 'EEEE, MMMM d')}</ThemedText>
          </View>
          {streak.current > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: theme.warning + '20', borderColor: theme.warning + '40' }]}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
              <Text style={[typography.title, { color: theme.warning }]}>{streak.current}</Text>
            </View>
          )}
        </View>

        {/* Progress */}
        {tasks.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.row}>
              <ThemedText variant="bodyMed">{t.todayPlan}</ThemedText>
              <ThemedText secondary>{progress.completed}/{progress.total}</ThemedText>
            </View>
            <ProgressBar progress={pct} style={{ marginTop: 8 }} height={6} color={pct === 1 ? theme.success : theme.accent} />
            {pct === 1 && <ThemedText style={{ color: theme.success, marginTop: 8, textAlign: 'center', ...typography.smallMed }}>{t.allDone}</ThemedText>}
          </View>
        )}

        {/* Active Task Banner */}
        {activeSession && activeTask && (
          <TouchableOpacity
            onPress={() => navigation.navigate('FocusTimer', { taskId: activeTask.id })}
            style={[styles.activeCard, { backgroundColor: activeTask.color + '15', borderColor: activeTask.color }]}
          >
            <View style={[styles.dot, { backgroundColor: activeTask.color }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.caption, { color: activeTask.color }]}>{activeSession.isBreak ? '☕ Break' : '⚡ Active'}</Text>
              <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{activeTask.name}</Text>
            </View>
            <Text style={{ color: activeTask.color, fontSize: 20 }}>→</Text>
          </TouchableOpacity>
        )}

        {/* Next Task */}
        {!activeSession && nextTask && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="caption" secondary style={{ marginBottom: 6 }}>{t.nextUp} →</ThemedText>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
                  {getCategoryById(nextTask.category).icon} {nextTask.name}
                </Text>
                <ThemedText secondary style={{ marginTop: 4 }}>⏱ {formatDuration(nextTask.duration)}{nextTask.breakAfter > 0 ? `  ☕ +${nextTask.breakAfter}m` : ''}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleStart(nextTask.id)} style={[styles.startBtn, { backgroundColor: theme.accent }]}>
                <Text style={{ color: '#fff', ...typography.bodyMed }}>{t.startTask}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Task List */}
        <ThemedText variant="title" style={{ marginHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm }}>{t.todayPlan}</ThemedText>

        {tasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accentDim }]}>
              <Ionicons name="calendar-outline" size={40} color={theme.accentLight} />
            </View>
            <ThemedText variant="title" style={{ marginTop: spacing.md, marginBottom: 6 }}>
              {language === 'uz' ? 'Bugun uchun reja yo\'q' : 'No plan for today'}
            </ThemedText>
            <ThemedText secondary style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              {language === 'uz'
                ? 'Birinchi vazifangizni qo\'shing\nva intizomni boshlang.'
                : 'Add your first task\nand start building discipline.'}
            </ThemedText>
            <TouchableOpacity
              onPress={() => navigation.navigate('Schedule')}
              style={[styles.addBtn, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={[typography.bodyMed, { color: '#fff', marginLeft: 6 }]}>{t.addTask}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...tasks].sort((a, b) => a.order - b.order).map((task) => {
            const cat = getCategoryById(task.category);
            const isDone = log.completed?.includes(task.id);
            const isSkipped = log.skipped?.includes(task.id);
            return (
              <View key={task.id} style={[styles.miniCard, {
                backgroundColor: theme.card, borderColor: theme.cardBorder,
                borderLeftColor: isDone ? theme.success : isSkipped ? theme.textMuted : task.color,
                opacity: isSkipped ? 0.6 : 1,
              }]}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>{isDone ? '✅' : isSkipped ? '⏭' : cat.icon}</Text>
                <Text style={[typography.bodyMed, { color: theme.text, flex: 1 }]} numberOfLines={1}>{task.name}</Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>{formatDuration(task.duration)}</Text>
                {!isDone && !isSkipped && !activeSession && (
                  <TouchableOpacity onPress={() => handleStart(task.id)} style={[styles.miniStart, { backgroundColor: task.color + '20' }]}>
                    <Text style={{ color: task.color, fontSize: 14 }}>▶</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  card: { marginHorizontal: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  startBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  emptyCard:  { margin: spacing.md, padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center' },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  miniCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderLeftWidth: 3 },
  miniStart: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
});
