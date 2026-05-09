import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { spacing, radius, typography } from '../constants/theme';
import { CATEGORIES } from '../constants/i18n';
import { ThemedText } from '../components/UI';

const COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EC4899','#EF4444','#8B5CF6','#06B6D4'];

// +/- step picker
const Stepper = ({ value, onChange, min = 0, max = 600, step = 5, label, theme }) => (
  <View style={styles.stepperRow}>
    <ThemedText secondary style={{ flex: 1 }}>{label}</ThemedText>
    <View style={styles.stepperControls}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - step))}
        style={[styles.stepBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}
      >
        <Ionicons name="remove" size={18} color={theme.text} />
      </TouchableOpacity>
      <View style={[styles.stepVal, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
        <Text style={[typography.timerSm, { color: theme.text }]}>{value}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + step))}
        style={[styles.stepBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}
      >
        <Ionicons name="add" size={18} color={theme.text} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function AddEditTaskScreen() {
  const navigation  = useNavigation();
  const route       = useRoute();
  const { theme }   = useTheme();
  const { t, language } = useI18n();

  const existing  = route.params?.task;
  const addTask   = useStore(s => s.addTask);
  const updateTask = useStore(s => s.updateTask);

  // Duration stored in minutes total
  const initDuration  = existing?.duration  ?? 60;
  const initBreak     = existing?.breakAfter ?? 10;

  const [name,      setName]      = useState(existing?.name      || '');
  const [durationH, setDurationH] = useState(Math.floor(initDuration / 60));
  const [durationM, setDurationM] = useState(initDuration % 60);
  const [hasBreak,  setHasBreak]  = useState(initBreak > 0);
  const [breakMin,  setBreakMin]  = useState(initBreak > 0 ? initBreak : 10);
  const [category,  setCategory]  = useState(existing?.category  || 'study');
  const [color,     setColor]     = useState(existing?.color      || '#7C3AED');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const totalDuration = durationH * 60 + durationM;
  const finalBreak    = hasBreak ? breakMin : 0; // explicit 0 when no break

  const handleSave = async () => {
    if (!name.trim()) { setError(t.taskName + ' required'); return; }
    if (totalDuration === 0) { setError('Duration must be > 0'); return; }
    setSaving(true);
    try {
      if (existing) {
        await updateTask(existing.id, {
          name: name.trim(), duration: totalDuration,
          breakAfter: finalBreak, category, color,
        });
      } else {
        await addTask({
          name: name.trim(), duration: totalDuration,
          breakAfter: finalBreak, category, color,
        });
      }
      navigation.goBack();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.separator }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <ThemedText variant="title">{existing ? t.editTask : t.addTask}</ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
            {saving
              ? <Ionicons name="hourglass-outline" size={20} color={theme.accentLight} />
              : <Ionicons name="checkmark" size={24} color={theme.accentLight} />
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Name */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="caption" muted style={styles.label}>
              {t.taskName.toUpperCase()}
            </ThemedText>
            <TextInput
              style={[styles.nameInput, { color: theme.text }]}
              value={name}
              onChangeText={v => { setName(v); setError(''); }}
              placeholder={t.taskName}
              placeholderTextColor={theme.textMuted}
              autoFocus={!existing}
              maxLength={60}
            />
            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />
                <Text style={[typography.caption, { color: theme.danger, marginLeft: 4 }]}>{error}</Text>
              </View>
            )}
          </View>

          {/* Duration */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="caption" muted style={styles.label}>
              {t.duration.toUpperCase()}
            </ThemedText>
            <Stepper value={durationH} onChange={setDurationH} min={0} max={12} step={1} label={t.hours} theme={theme} />
            <Stepper value={durationM} onChange={setDurationM} min={0} max={55} step={5} label={t.minutes} theme={theme} />
            {/* Preview */}
            <View style={[styles.durationPreview, { backgroundColor: color + '12' }]}>
              <Ionicons name="time-outline" size={14} color={color} />
              <Text style={[typography.smallMed, { color, marginLeft: 6 }]}>
                {durationH > 0 ? `${durationH}h ` : ''}{durationM > 0 ? `${durationM}m` : durationH === 0 ? '0m' : ''}
              </Text>
            </View>
          </View>

          {/* Break */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.breakHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="caption" muted style={styles.label}>
                  {t.breakAfter.toUpperCase()}
                </ThemedText>
                <ThemedText secondary style={typography.caption}>
                  {hasBreak ? `☕ ${breakMin}m break after task` : 'No break'}
                </ThemedText>
              </View>
              <Switch
                value={hasBreak}
                onValueChange={setHasBreak}
                trackColor={{ true: theme.accent }}
                thumbColor="#fff"
              />
            </View>
            {hasBreak && (
              <Stepper value={breakMin} onChange={setBreakMin} min={5} max={60} step={5} label={t.minutes} theme={theme} />
            )}
          </View>

          {/* Category */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="caption" muted style={styles.label}>
              {t.category.toUpperCase()}
            </ThemedText>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => {
                const sel = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => { setCategory(cat.id); setColor(cat.color); }}
                    style={[styles.catChip, {
                      backgroundColor: sel ? cat.color + '22' : theme.cardElevated,
                      borderColor:     sel ? cat.color         : theme.cardBorder,
                    }]}
                  >
                    <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                    <Text style={[typography.smallMed, { color: sel ? cat.color : theme.textSecondary, marginLeft: 6 }]}>
                      {language === 'uz' ? cat.labelUz : cat.label}
                    </Text>
                    {sel && <Ionicons name="checkmark" size={14} color={cat.color} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Color */}
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText variant="caption" muted style={styles.label}>{t.color.toUpperCase()}</ThemedText>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && { transform: [{ scale: 1.2 }], elevation: 4 }]}>
                  {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview card */}
          <View style={[styles.preview, { backgroundColor: color + '12', borderColor: color + '40' }]}>
            <View style={[styles.previewBar, { backgroundColor: color }]} />
            <Text style={{ fontSize: 20, marginHorizontal: 10 }}>{selectedCat?.icon}</Text>
            <Text style={[typography.title, { color: theme.text, flex: 1 }]} numberOfLines={1}>
              {name || t.taskName}
            </Text>
            <Text style={[typography.caption, { color }]}>
              {durationH > 0 ? `${durationH}h ` : ''}{durationM > 0 ? `${durationM}m` : ''}
              {hasBreak ? ` ☕${breakMin}m` : ''}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom buttons */}
        <View style={[styles.bottom, { borderTopColor: theme.separator, backgroundColor: theme.bg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={[styles.bottomBtn, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <Text style={[typography.bodyMed, { color: theme.textSecondary }]}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving}
            style={[styles.bottomBtn, { backgroundColor: color, opacity: saving ? 0.7 : 1 }]}>
            {saving
              ? <Ionicons name="hourglass-outline" size={18} color="#fff" />
              : <Text style={[typography.bodyMed, { color: '#fff' }]}>{t.save}</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerBtn:   { width: 40, alignItems: 'center' },
  scroll:      { padding: spacing.md, gap: spacing.sm },
  section:     { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  label:       { marginBottom: spacing.sm, letterSpacing: 0.5 },
  nameInput:   { ...typography.title, paddingVertical: spacing.sm },
  errorRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  stepperRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:     { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepVal:     { width: 60, height: 40, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  durationPreview: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, padding: 8, borderRadius: radius.sm },
  breakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  colorRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  colorDot:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  preview:     { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginTop: spacing.sm },
  previewBar:  { width: 4, height: 36, borderRadius: 2 },
  bottom:      { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1 },
  bottomBtn:   { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
});
