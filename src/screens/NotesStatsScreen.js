import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { selectAllNotes, selectWeeklyStats } from '../store/selectors';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { ThemedText } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';
import { CATEGORIES } from '../constants/i18n';

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab() {
  const { theme } = useTheme();
  const { t }     = useI18n();
  const [search, setSearch] = useState('');

  const tasks      = useStore(s => s.tasks);
  const dailyLogs  = useStore(s => s.dailyLogs);
  const deleteNote = useStore(s => s.deleteNote);

  const allNotes = useMemo(() => selectAllNotes(tasks, dailyLogs), [tasks, dailyLogs]);
  const filtered = useMemo(() => {
    if (!search.trim()) return allNotes;
    const q = search.toLowerCase();
    return allNotes.filter(n => n.text.toLowerCase().includes(q) || n.taskName.toLowerCase().includes(q));
  }, [allNotes, search]);

  const handleDelete = (note) => {
    Alert.alert('Delete Note', 'Remove this note?', [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: () => deleteNote({ date: note.date, taskId: note.taskId, noteId: note.id }) },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.searchBar, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
        <Text style={{ fontSize: 15, marginRight: 8 }}>🔍</Text>
        <TextInput style={[{ flex: 1, ...typography.body, color: theme.text }]} placeholder="Search notes..." placeholderTextColor={theme.textMuted} value={search} onChangeText={setSearch} />
        {!!search && <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity>}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
          <ThemedText secondary style={{ textAlign: 'center' }}>{t.noNotes}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.noteHeader}>
                <View style={[styles.taskTag, { backgroundColor: theme.accentDim }]}>
                  <Text style={[typography.caption, { color: theme.accentLight }]}>{item.taskName}</Text>
                </View>
                <Text style={[typography.caption, { color: theme.textMuted }]}>{format(parseISO(item.timestamp), 'MMM d · HH:mm')}</Text>
              </View>
              <Text style={[typography.body, { color: theme.text, marginTop: 8 }]}>{item.text}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Text style={{ color: theme.textMuted }}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { theme } = useTheme();
  const { t, language } = useI18n();

  const streak    = useStore(s => s.streak);
  const dailyLogs = useStore(s => s.dailyLogs);
  const tasks     = useStore(s => s.tasks);

  const weeklyData = useMemo(() => selectWeeklyStats(dailyLogs), [dailyLogs]);

  const { totalCompleted, totalHours, catCounts } = useMemo(() => {
    const allCompleted = Object.values(dailyLogs).flatMap(l => l.completed || []);
    const totalFocusMin = tasks.reduce((acc, t) => acc + allCompleted.filter(id => id === t.id).length * t.duration, 0);
    const catCounts = {};
    CATEGORIES.forEach(c => { catCounts[c.id] = 0; });
    tasks.forEach(task => {
      catCounts[task.category] = (catCounts[task.category] || 0) + allCompleted.filter(id => id === task.id).length;
    });
    return { totalCompleted: allCompleted.length, totalHours: (totalFocusMin / 60).toFixed(1), catCounts };
  }, [tasks, dailyLogs]);

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);
  const catTotal = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {/* Stat cards */}
      <View style={styles.statsGrid}>
        {[
          { icon: '🔥', label: t.streak,          value: streak.current,   sub: `${t.longestStreak}: ${streak.longest}`, color: theme.warning },
          { icon: '⏱',  label: t.totalFocus,       value: totalHours,       sub: 'hours',                                 color: theme.accentLight },
          { icon: '✅', label: t.tasksCompleted,    value: totalCompleted,   sub: null,                                    color: theme.success },
        ].map(item => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: item.color + '30' }]}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</Text>
            <Text style={[typography.h2, { color: item.color }]}>{item.value}</Text>
            <Text style={[typography.smallMed, { color: theme.text, textAlign: 'center' }]}>{item.label}</Text>
            {item.sub && <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{item.sub}</Text>}
          </View>
        ))}
      </View>

      {/* Weekly chart */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <ThemedText variant="title" style={{ marginBottom: spacing.md }}>{t.weeklyProgress}</ThemedText>
        <View style={styles.chart}>
          {weeklyData.map(day => {
            const pct = day.completed / maxCompleted;
            const isToday = day.date === todayStr;
            return (
              <View key={day.date} style={styles.barCol}>
                <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 4, fontSize: 10 }]}>{day.completed > 0 ? day.completed : ''}</Text>
                <View style={[styles.barTrack, { backgroundColor: theme.cardBorder }]}>
                  <View style={[styles.barFill, { height: `${Math.max(pct * 100, day.completed > 0 ? 6 : 0)}%`, backgroundColor: isToday ? theme.accent : theme.accentLight, opacity: isToday ? 1 : 0.55 }]} />
                </View>
                <Text style={[typography.caption, { color: isToday ? theme.accentLight : theme.textMuted, marginTop: 5, fontSize: 10 }]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Category breakdown */}
      {catTotal > 1 && (
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedText variant="title" style={{ marginBottom: spacing.md }}>{t.categoryBreakdown}</ThemedText>
          {CATEGORIES.map(cat => {
            const count = catCounts[cat.id] || 0;
            if (!count) return null;
            const pct = count / catTotal;
            return (
              <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 16, width: 26 }}>{cat.icon}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[typography.smallMed, { color: theme.text }]}>{language === 'uz' ? cat.labelUz : cat.label}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>{count} · {Math.round(pct * 100)}%</Text>
                  </View>
                  <View style={{ height: 5, backgroundColor: theme.cardBorder, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: 5, width: `${pct * 100}%`, backgroundColor: cat.color, borderRadius: 3 }} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Combined Screen ──────────────────────────────────────────────────────────

export default function NotesStatsScreen() {
  const { theme } = useTheme();
  const { t }     = useI18n();
  const [tab, setTab] = useState('notes'); // 'notes' | 'stats'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h2">{tab === 'notes' ? t.myNotes : t.stats}</ThemedText>
        {/* Segment toggle */}
        <View style={[styles.segment, { backgroundColor: theme.cardElevated }]}>
          <TouchableOpacity
            onPress={() => setTab('notes')}
            style={[styles.segBtn, tab === 'notes' && { backgroundColor: theme.accent }]}
          >
            <Text style={[typography.smallMed, { color: tab === 'notes' ? '#fff' : theme.textSecondary }]}>📝 {t.notes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('stats')}
            style={[styles.segBtn, tab === 'stats' && { backgroundColor: theme.accent }]}
          >
            <Text style={[typography.smallMed, { color: tab === 'stats' ? '#fff' : theme.textSecondary }]}>📊 {t.stats}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'notes' ? <NotesTab /> : <StatsTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm - 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  noteCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  deleteBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: 6 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  section: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 5 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '65%', height: 75, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
});
