import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { spacing, radius, typography } from '../constants/theme';
import { getCategoryById } from '../constants/i18n';

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const TaskCard = ({ task, onEdit, onStart, drag, isActive, isCompleted, isSkipped, showStart = false }) => {
  const { theme }  = useTheme();
  const { t, language } = useI18n();
  const deleteTask = useStore(s => s.deleteTask);
  const category   = getCategoryById(task.category);

  const animStyle = useAnimatedStyle(() => ({
    shadowOpacity: isActive ? 0.3 : 0,
    elevation:     isActive ? 8 : 0,
  }));

  const handleDelete = () => {
    Alert.alert(t.deleteTask, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  };

  const statusColor = isCompleted ? theme.success : isSkipped ? theme.textMuted : (task.color || theme.accent);

  return (
    <Animated.View style={[animStyle, styles.wrapper]}>
      <View style={[styles.card, {
        backgroundColor: theme.card,
        borderColor:     isActive ? theme.accent : theme.cardBorder,
        borderLeftColor: statusColor,
        opacity:         isSkipped ? 0.5 : 1,
      }]}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>{category.icon}</Text>
            <Text style={[typography.title, { color: theme.text, flex: 1 }]} numberOfLines={1}>
              {task.name}
            </Text>
            {isCompleted && <Ionicons name="checkmark-circle" size={18} color={theme.success} />}
            {isSkipped   && <Ionicons name="play-skip-forward" size={18} color={theme.textMuted} />}
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={[styles.tag, { backgroundColor: statusColor + '15', borderColor: statusColor + '40' }]}>
              <Ionicons name="time-outline" size={11} color={statusColor} />
              <Text style={[typography.caption, { color: statusColor, marginLeft: 3 }]}>
                {formatDuration(task.duration)}
              </Text>
            </View>
            {task.breakAfter > 0 && (
              <View style={[styles.tag, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
                <Ionicons name="cafe-outline" size={11} color={theme.textMuted} />
                <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 3 }]}>
                  {formatDuration(task.breakAfter)}
                </Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: category.color + '12', borderColor: category.color + '35' }]}>
              <Text style={[typography.caption, { color: category.color }]}>
                {language === 'uz' ? category.labelUz : category.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {showStart && !isCompleted && !isSkipped && (
            <TouchableOpacity onPress={() => onStart?.(task.id)}
              style={[styles.actionBtn, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="play" size={16} color={theme.accentLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onEdit?.(task)}
            style={[styles.actionBtn, { backgroundColor: theme.cardElevated }]}>
            <Ionicons name="pencil" size={15} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}
            style={[styles.actionBtn, { backgroundColor: theme.dangerBg }]}>
            <Ionicons name="trash-outline" size={15} color={theme.danger} />
          </TouchableOpacity>
          {drag && (
            <TouchableOpacity onLongPress={drag}
              style={[styles.actionBtn, { backgroundColor: theme.cardElevated }]}>
              <Ionicons name="reorder-three" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper:   { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  card:      { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 3, overflow: 'hidden' },
  content:   { flex: 1, padding: spacing.md },
  row:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  tag:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, marginRight: 6, marginTop: 2 },
  actions:   { flexDirection: 'row', padding: spacing.sm, gap: 4 },
  actionBtn: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
