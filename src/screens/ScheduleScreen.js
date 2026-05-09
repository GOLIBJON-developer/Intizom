import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { TaskCard } from '../components/TaskCard';
import { ThemedText } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';
import { showTaskAlert } from '../utils/notifications';

export default function ScheduleScreen() {
  const navigation  = useNavigation();
  const { theme }   = useTheme();
  const { t }       = useI18n();
  const insets      = useSafeAreaInsets();

  const tasks        = useStore(s => s.tasks);
  const settings     = useStore(s => s.settings);
  const reorderTasks = useStore(s => s.reorderTasks);
  const startSession = useStore(s => s.startSession);

  const sorted = useMemo(() => [...tasks].sort((a, b) => a.order - b.order), [tasks]);

  const totalMin = useMemo(() =>
    tasks.reduce((acc, t) => acc + t.duration + (t.breakAfter || 0), 0),
  [tasks]);
  const totalH = Math.floor(totalMin / 60);
  const totalM = totalMin % 60;

  const handleStart = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    startSession(taskId);
    if (task && settings?.notificationsEnabled !== false) {
      await showTaskAlert({
        taskName: task.name,
        duration: task.duration,
        language: settings?.language || 'en',
      });
    }
    navigation.navigate('FocusTimer', { taskId });
  };

  const handleDragEnd = ({ data }) => {
    reorderTasks(data);
  };

  const renderItem = ({ item, drag, isActive }) => {
    const dragWithHaptic = async () => {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      drag();
    };
    return (
      <ScaleDecorator>
        <TaskCard
          task={item}
          drag={dragWithHaptic}
          isActive={isActive}
          showStart
          onStart={handleStart}
          onEdit={(task) => navigation.navigate('AddEditTask', { task })}
        />
      </ScaleDecorator>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText variant="h2">{t.schedule}</ThemedText>
          {tasks.length > 0 && (
            <ThemedText secondary style={{ marginTop: 2 }}>
              {tasks.length} {t.tasksLeft} ·{' '}
              {totalH > 0 ? `${totalH}h ` : ''}{totalM > 0 ? `${totalM}m` : ''}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditTask', {})}
          style={[styles.addBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={[typography.bodyMed, { color: '#fff', marginLeft: 4 }]}>
            {t.addTask}
          </Text>
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={64} color={theme.textMuted} />
          <ThemedText variant="title" style={{ marginTop: 16, marginBottom: 8 }}>
            {t.noTasks}
          </ThemedText>
          <ThemedText secondary style={{ textAlign: 'center', marginBottom: 24 }}>
            {t.schedule} — {t.addTask}
          </ThemedText>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditTask', {})}
            style={[styles.emptyBtn, { backgroundColor: theme.accentDim, borderColor: theme.accent + '50' }]}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.accentLight} />
            <Text style={[typography.bodyMed, { color: theme.accentLight, marginLeft: 6 }]}>
              {t.addTask}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <DraggableFlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          onDragBegin={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
          }}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={[styles.footer, { borderColor: theme.cardBorder }]}>
              <Ionicons name="time-outline" size={16} color={theme.textMuted} />
              <ThemedText secondary style={{ marginLeft: 8 }}>
                Total: {totalH > 0 ? `${totalH}h ` : ''}{totalM > 0 ? `${totalM}m` : '0m'}
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  addBtn:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  empty:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  footer:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, borderTopWidth: 1, borderStyle: 'dashed' },
});
