import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { selectAllNotes } from '../store/selectors';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useTheme';
import { ThemedText } from '../components/UI';
import { spacing, radius, typography } from '../constants/theme';

export default function NotesScreen() {
  const { theme } = useTheme();
  const { t }     = useI18n();
  const insets    = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const tasks      = useStore(s => s.tasks);
  const dailyLogs  = useStore(s => s.dailyLogs);
  const deleteNote = useStore(s => s.deleteNote);

  const allNotes = useMemo(() => selectAllNotes(tasks, dailyLogs), [tasks, dailyLogs]);
  const filtered = useMemo(() => {
    if (!search.trim()) return allNotes;
    const q = search.toLowerCase();
    return allNotes.filter(n =>
      n.text.toLowerCase().includes(q) || n.taskName.toLowerCase().includes(q)
    );
  }, [allNotes, search]);

  const handleDelete = (note) => {
    Alert.alert('Delete Note', 'Remove this note?', [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: () => deleteNote({ date: note.date, taskId: note.taskId, noteId: note.id }) },
    ]);
  };

  const renderNote = ({ item }) => (
    <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.noteHeader}>
        <View style={[styles.taskTag, { backgroundColor: theme.accentDim }]}>
          <Ionicons name="flash" size={11} color={theme.accentLight} />
          <Text style={[typography.caption, { color: theme.accentLight, marginLeft: 4 }]}>{item.taskName}</Text>
        </View>
        <Text style={[typography.caption, { color: theme.textMuted }]}>
          {format(parseISO(item.timestamp), 'MMM d · HH:mm')}
        </Text>
      </View>
      <Text style={[typography.body, { color: theme.text, marginTop: spacing.sm }]}>{item.text}</Text>
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.header}>
        <ThemedText variant="h2">{t.myNotes}</ThemedText>
        <Text style={[typography.caption, { color: theme.textMuted }]}>{allNotes.length}</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="search" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search..." placeholderTextColor={theme.textMuted}
          value={search} onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={56} color={theme.textMuted} />
          <ThemedText secondary style={{ textAlign: 'center', marginTop: 16 }}>{t.noNotes}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={item => item.id} renderItem={renderNote}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  searchInput: { flex: 1, ...typography.body },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  noteCard:  { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.sm },
  noteHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTag:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  deleteBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: 6 },
});
