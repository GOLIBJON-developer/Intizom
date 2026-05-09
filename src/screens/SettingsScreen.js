import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Switch, Modal, TextInput, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store/useStore';
import { scheduleEndOfDaySummary } from '../utils/notifications';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { ThemedText, Divider } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';

// ─── Small reusable components ───────────────────────────────────────────────

const SectionLabel = ({ label, theme }) => (
  <Text style={{ ...typography.caption, color: theme.textMuted, letterSpacing: 0.8, paddingHorizontal: spacing.md + 4, paddingBottom: 6, paddingTop: spacing.md }}>
    {label.toUpperCase()}
  </Text>
);

const Row = ({ icon, label, sub, children, onPress, theme, danger }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}
    style={[styles.row, { borderBottomColor: theme.separator }]}>
    <View style={styles.rowLeft}>
      {icon ? <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMed, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
        {sub ? <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={2}>{sub}</Text> : null}
      </View>
    </View>
    {children}
  </TouchableOpacity>
);

const Segment = ({ options, value, onChange, theme }) => (
  <View style={[styles.segment, { backgroundColor: theme.cardElevated }]}>
    {options.map(opt => (
      <TouchableOpacity key={opt.value} onPress={() => onChange(opt.value)}
        style={[styles.segBtn, value === opt.value && { backgroundColor: theme.accent }]}>
        <Text style={[typography.smallMed, { color: value === opt.value ? '#fff' : theme.textSecondary }]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Generic input modal ──────────────────────────────────────────────────────
const InputModal = ({ visible, title, value, onClose, onSave, placeholder, hint, theme, insets }) => {
  const [text, setText] = useState(value);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingBottom: insets.bottom + 16 }]}>
          <ThemedText variant="title" style={{ marginBottom: spacing.md }}>{title}</ThemedText>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.cardBorder }]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          {hint ? <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4, marginBottom: spacing.md }]}>{hint}</Text>
                : <View style={{ height: spacing.md }} />}
          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.cardElevated }]}>
              <Text style={{ color: theme.textSecondary, ...typography.bodyMed }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onSave(text); onClose(); }} style={[styles.modalBtn, { backgroundColor: theme.accent }]}>
              <Text style={{ color: '#fff', ...typography.bodyMed }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { t, language } = useI18n();
  const insets    = useSafeAreaInsets();

  const settings       = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const exportData     = useStore(s => s.exportData);
  const importData     = useStore(s => s.importData);
  const resetData      = useStore(s => s.resetData);

  const [timeModal, setTimeModal] = useState(false);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const path = await exportData();
      if (!path) { Alert.alert('Error', 'Failed to prepare export file.'); return; }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Share Intizom Backup' });
      } else {
        Alert.alert('Saved', `File: ${path}`);
      }
    } catch (e) { Alert.alert('Error', e?.message || 'Export failed'); }
  };

  // ── Pick save folder (SAF — works in APK, not Expo Go) ───────────────────
  const handlePickFolder = async () => {
    const SAF = FileSystem.StorageAccessFramework;
    if (Platform.OS === 'android' && SAF?.requestDirectoryPermissionsAsync) {
      try {
        const perm = await SAF.requestDirectoryPermissionsAsync();
        if (!perm.granted) return;
        // Write current data to chosen folder immediately
        const { tasks, dailyLogs, streak, settings: s } = useStore.getState();
        const content = JSON.stringify({ tasks, dailyLogs, streak, settings: s }, null, 2);
        const dest = await SAF.createFileAsync(perm.directoryUri, 'intizom-data.json', 'application/json');
        await FileSystem.writeAsStringAsync(dest, content);
        // Save folder URI so future exports go here automatically
        await updateSettings({ exportFolderUri: perm.directoryUri });
        Alert.alert('✅ Joylashuv belgilandi', `intizom-data.json shu papkaga saqlandi.\nKeyingi eksportlar ham shu yerga boradi.`);
      } catch (e) {
        Alert.alert('Xato', e?.message || 'Papka tanlab bo\'lmadi');
      }
    } else {
      // Expo Go da SAF ishlamaydi — bu funksiya faqat APK build da ishlaydi
      Alert.alert(
        'APK Build kerak',
        'Papka tanlash faqat to\'liq APK/IPA build da ishlaydi.\n\nExpo Go da "Export Data" tugmasi orqali faylni saqlashingiz mumkin.',
        [
          { text: 'OK' },
          { text: 'Export qilish', onPress: handleExport },
        ]
      );
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'] });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      const ok = await importData(uri);
      Alert.alert(ok ? '✅ Imported!' : '❌ Failed', ok ? 'Data restored successfully.' : 'Invalid file format.');
    } catch (e) { Alert.alert('Error', e?.message); }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () =>
    Alert.alert(t.resetData, t.resetConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: resetData },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>

        <ThemedText variant="h2" style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          {t.settings}
        </ThemedText>

        {/* Appearance */}
        <SectionLabel label={t.appearance} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row icon="🎨" label={t.theme} theme={theme}>
            <Segment theme={theme} value={settings.theme} onChange={v => updateSettings({ theme: v })}
              options={[{ value: 'light', label: t.light }, { value: 'dark', label: t.dark }, { value: 'system', label: t.system }]} />
          </Row>
        </View>

        {/* Language */}
        <SectionLabel label={t.language} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row icon="🌐" label={t.language} theme={theme}>
            <Segment theme={theme} value={settings.language} onChange={v => updateSettings({ language: v })}
              options={[{ value: 'en', label: '🇬🇧 EN' }, { value: 'uz', label: '🇺🇿 UZ' }]} />
          </Row>
          <Divider />
          <Row icon="🎙" label={t.voiceLanguage} theme={theme}>
            <Segment theme={theme} value={settings.voiceLanguage} onChange={v => updateSettings({ voiceLanguage: v })}
              options={[{ value: 'en-US', label: 'EN' }, { value: 'uz-UZ', label: 'UZ' }]} />
          </Row>
        </View>

        {/* Notifications */}
        <SectionLabel label={t.notifications} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row icon="🔔" label={t.enableNotifs} theme={theme}>
            <Switch value={!!settings.notificationsEnabled}
              onValueChange={v => updateSettings({ notificationsEnabled: v })}
              trackColor={{ true: theme.accent }} thumbColor="#fff" />
          </Row>
          <Divider />
          {/* End-of-day time — proper modal, works on Android */}
          <Row icon="🕙" label={t.summaryTime}
            sub={`Daily summary at ${settings.endOfDaySummaryTime || '22:00'}`}
            theme={theme} onPress={() => setTimeModal(true)}>
            <Text style={[typography.smallMed, { color: theme.accentLight }]}>
              {settings.endOfDaySummaryTime || '22:00'} ›
            </Text>
          </Row>
        </View>

        {/* Data */}
        <SectionLabel label={t.dataStorage} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

          {/* 1. Saqlash joyi — folder picker */}
          <Row
            theme={theme}
            onPress={handlePickFolder}
            label={language === 'uz' ? 'Saqlash joyi' : 'Save Location'}
            sub={
              settings.exportFolderUri
                ? (language === 'uz' ? 'Joylashuv belgilangan ✓  •  O\'zgartirish' : 'Location set ✓  •  Change')
                : (language === 'uz' ? 'Papka tanlang (APK build kerak)' : 'Pick folder (requires APK build)')
            }
          >
            <Ionicons name="folder-open-outline" size={20} color={
              settings.exportFolderUri ? theme.success : theme.accentLight
            } />
          </Row>
          <Divider />

          {/* 2. Export — JSON faylni ulashish */}
          <Row
            theme={theme}
            onPress={handleExport}
            label={language === 'uz' ? 'Ma\'lumotni eksport' : t.exportData}
            sub={language === 'uz' ? 'JSON faylni ulashish / saqlash' : 'Share or save JSON backup'}
          >
            <Ionicons name="share-outline" size={20} color={theme.accentLight} />
          </Row>
          <Divider />

          {/* 3. Import — fayldan tiklash */}
          <Row
            theme={theme}
            onPress={handleImport}
            label={language === 'uz' ? 'Ma\'lumotni import' : t.importData}
            sub={language === 'uz' ? 'JSON fayldan tiklash' : 'Restore from JSON file'}
          >
            <Ionicons name="download-outline" size={20} color={theme.accentLight} />
          </Row>
          <Divider />

          {/* 4. Reset */}
          <Row
            theme={theme}
            onPress={handleReset}
            label={t.resetData}
            sub={language === 'uz' ? 'Barcha ma\'lumotlarni o\'chirish' : 'Delete all data permanently'}
            danger
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </Row>
        </View>

        {/* About */}
        <SectionLabel label={t.about} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row icon="⚡" label="Intizom" sub="Discipline. Focus. Results.  v1.0.0" theme={theme} />
        </View>

      </ScrollView>

      {/* End-of-day time modal — works on Android */}
      <InputModal
        visible={timeModal}
        title="End-of-Day Summary Time"
        value={settings.endOfDaySummaryTime || '22:00'}
        placeholder="22:00"
        hint="Format: HH:MM  (e.g. 22:00, 21:30)"
        onClose={() => setTimeModal(false)}
        onSave={async v => {
                await updateSettings({ endOfDaySummaryTime: v });
                scheduleEndOfDaySummary({ time: v, completed: 0, total: 0, language });
              }}
        theme={theme}
        insets={insets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card:     { marginHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: 2 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1 },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  segment:  { flexDirection: 'row', borderRadius: radius.sm, padding: 2 },
  segBtn:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm - 1 },
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, padding: spacing.lg },
  textInput:{ borderRadius: radius.md, borderWidth: 1, padding: spacing.md, ...typography.body },
  modalBtns:{ flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});
