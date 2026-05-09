import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { selectWeeklyStats } from '../store/selectors';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { ThemedText } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';
import { CATEGORIES } from '../constants/i18n';

const StatCard = ({ iconName, label, value, sub, color, theme }) => (
  <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: color + '30', borderWidth: 1 }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={iconName} size={22} color={color} />
    </View>
    <Text style={[typography.h2, { color: color || theme.text, marginTop: 8 }]}>{value}</Text>
    <Text style={[typography.smallMed, { color: theme.text, marginTop: 2 }]}>{label}</Text>
    {sub && <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{sub}</Text>}
  </View>
);

export default function StatsScreen() {
  const { theme }        = useTheme();
  const { t, language }  = useI18n();
  const insets           = useSafeAreaInsets();

  const streak    = useStore(s => s.streak);
  const dailyLogs = useStore(s => s.dailyLogs);
  const tasks     = useStore(s => s.tasks);

  const weeklyData = useMemo(() => selectWeeklyStats(dailyLogs), [dailyLogs]);

  const { totalCompleted, totalHours, catCounts, hasAnyData } = useMemo(() => {
    const allCompleted = Object.values(dailyLogs).flatMap(l => l.completed || []);
    const totalFocusMin = tasks.reduce((acc, t) =>
      acc + allCompleted.filter(id => id === t.id).length * t.duration, 0);
    const catCounts = {};
    CATEGORIES.forEach(c => { catCounts[c.id] = 0; });
    tasks.forEach(task => {
      const count = allCompleted.filter(id => id === task.id).length;
      if (catCounts[task.category] !== undefined) catCounts[task.category] += count;
    });
    return {
      totalCompleted: allCompleted.length,
      totalHours:     (totalFocusMin / 60).toFixed(1),
      catCounts,
      hasAnyData:     allCompleted.length > 0,
    };
  }, [tasks, dailyLogs]);

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);
  const catTotal     = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;

  // Empty state
  if (!hasAnyData && streak.current === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <ThemedText variant="h2" style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          {t.stats}
        </ThemedText>
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={72} color={theme.textMuted} />
          <ThemedText variant="title" style={{ marginTop: spacing.lg, marginBottom: 8 }}>
            {language === 'uz' ? 'Hali statistika yo\'q' : 'No stats yet'}
          </ThemedText>
          <ThemedText secondary style={{ textAlign: 'center', lineHeight: 22 }}>
            {language === 'uz'
              ? 'Birinchi taskingizni bajaring —\nnatijalar shu yerda ko\'rinadi.'
              : 'Complete your first task —\nresults will appear here.'}
          </ThemedText>
          <View style={[styles.emptyHint, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="flash" size={16} color={theme.accent} />
            <Text style={[typography.smallMed, { color: theme.textSecondary, marginLeft: 8 }]}>
              {language === 'uz' ? 'Jadval → task boshlang' : 'Go to Schedule → Start a task'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
        <ThemedText variant="h2" style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          {t.stats}
        </ThemedText>

        {/* Top stat cards */}
        {totalCompleted === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={56} color={theme.textMuted} />
            <ThemedText variant="title" style={{ marginTop: 16, marginBottom: 8 }}>No data yet</ThemedText>
            <ThemedText secondary style={{ textAlign: 'center' }}>
              Complete your first task to see stats here!
            </ThemedText>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard iconName="flame" label={t.streak} value={streak.current}
            color={theme.warning} theme={theme} sub={`${t.longestStreak}: ${streak.longest}`} />
          <StatCard iconName="time" label={t.totalFocus} value={totalHours}
            color={theme.accentLight} theme={theme} sub="hours" />
          <StatCard iconName="checkmark-circle" label={t.tasksCompleted} value={totalCompleted}
            color={theme.success} theme={theme} />
        </View>

        {/* Weekly chart */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedText variant="title" style={{ marginBottom: spacing.md }}>{t.weeklyProgress}</ThemedText>
          <View style={styles.chart}>
            {weeklyData.map((day) => {
              const pct     = day.completed / maxCompleted;
              const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
              const barH    = `${Math.max(pct * 100, day.completed > 0 ? 10 : 2)}%`;
              return (
                <View key={day.date} style={styles.barCol}>
                  <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 4, fontSize: 10 }]}>
                    {day.completed > 0 ? day.completed : ''}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: theme.cardBorder }]}>
                    <View style={[styles.barFill, {
                      height: barH,
                      backgroundColor: isToday ? theme.accent : theme.accentLight,
                      opacity: isToday ? 1 : 0.55,
                    }]} />
                  </View>
                  <Text style={[typography.caption, { color: isToday ? theme.accentLight : theme.textMuted, marginTop: 6, fontSize: 10 }]}>
                    {day.label}
                  </Text>
                  {isToday && <View style={[styles.todayDot, { backgroundColor: theme.accent }]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Category breakdown */}
        {hasAnyData && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="title" style={{ marginBottom: spacing.md }}>{t.categoryBreakdown}</ThemedText>
            {CATEGORIES.map(cat => {
              const count = catCounts[cat.id] || 0;
              if (count === 0) return null;
              const pct = count / catTotal;
              return (
                <View key={cat.id} style={styles.catRow}>
                  <Text style={{ fontSize: 18, width: 30 }}>{cat.icon}</Text>
                  <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                    <View style={styles.catLabelRow}>
                      <Text style={[typography.smallMed, { color: theme.text }]}>
                        {language === 'uz' ? cat.labelUz : cat.label}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {count} · {Math.round(pct * 100)}%
                      </Text>
                    </View>
                    <View style={[styles.catTrack, { backgroundColor: theme.cardBorder }]}>
                      <View style={[styles.catFill, { width: `${pct * 100}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsGrid:  { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  statCard:   { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg },
  statIcon:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section:    { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  chart:      { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 6 },
  barCol:     { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack:   { width: '70%', height: 80, borderRadius: radius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill:    { width: '100%', borderRadius: radius.sm },
  todayDot:   { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  catRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  catLabelRow:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catTrack:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill:    { height: 6, borderRadius: 3 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyHint:  { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
});
