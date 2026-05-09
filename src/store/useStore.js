import { create } from 'zustand';
import { format, isToday, isYesterday, parseISO, differenceInCalendarDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LegacyFS from 'expo-file-system/legacy';

// ─── ID generator ─────────────────────────────────────────────────────────────
let _counter = 0;
const genId = () =>
  `${Date.now().toString(36)}_${(++_counter).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const STORAGE_KEY = '@intizom_v2';

const DEFAULT_SETTINGS = {
  theme: 'system', language: 'en',
  endOfDaySummaryTime: '22:00',
  notificationsEnabled: true,
  voiceLanguage: 'en-US',
};

export const todayKey   = () => format(new Date(), 'yyyy-MM-dd');
const emptyLog          = () => ({ completed: [], skipped: [], notes: {} });

// ─── AsyncStorage ─────────────────────────────────────────────────────────────
const loadStorage = async () => {
  try { const r = await AsyncStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
};
const saveStorage = async (data) => {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch (e) { console.warn('saveStorage:', e?.message); return false; }
};

// ─── File backup ──────────────────────────────────────────────────────────────
export const exportToFile = async (data) => {
  try {
    const path = LegacyFS.cacheDirectory + 'intizom-backup.json';
    await LegacyFS.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    return path;
  } catch (e) { console.warn('exportToFile:', e?.message); return null; }
};

export const importFromFile = async (uri) => {
  try { const raw = await LegacyFS.readAsStringAsync(uri); return JSON.parse(raw); }
  catch (e) { console.warn('importFromFile:', e?.message); return null; }
};

// ─── Streak helpers ───────────────────────────────────────────────────────────
// A day "counts" if at least one non-break task was completed
const dayHasCompletion = (log, tasks) => {
  if (!log?.completed?.length) return false;
  const nonBreak = tasks.filter(t => t.category !== 'break').map(t => t.id);
  return log.completed.some(id => nonBreak.includes(id));
};

const recalcStreak = (dailyLogs, tasks) => {
  const today = todayKey();
  const dates  = Object.keys(dailyLogs).sort(); // asc

  let current = 0, longest = 0, lastDate = null;
  let streak  = 0, prevDate = null;

  for (const date of dates) {
    if (!dayHasCompletion(dailyLogs[date], tasks)) continue;
    if (!prevDate) {
      streak = 1;
    } else {
      const gap = differenceInCalendarDays(parseISO(date), parseISO(prevDate));
      streak    = gap === 1 ? streak + 1 : 1;
    }
    prevDate  = date;
    lastDate  = date;
    longest   = Math.max(longest, streak);
  }

  // If last completion was more than 1 day ago, current streak is 0
  if (lastDate) {
    const gap = differenceInCalendarDays(new Date(), parseISO(lastDate));
    current   = gap <= 1 ? streak : 0;
  }

  return { current, longest, lastDate };
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
  tasks: [], dailyLogs: {},
  streak:        { current: 0, longest: 0, lastDate: null },
  settings:      DEFAULT_SETTINGS,
  activeSession: null,
  isLoaded:      false,

  loadData: async () => {
    const data = await loadStorage();
    set({
      tasks:     data?.tasks     || [],
      dailyLogs: data?.dailyLogs || {},
      streak:    data?.streak    || { current: 0, longest: 0, lastDate: null },
      settings:  { ...DEFAULT_SETTINGS, ...(data?.settings || {}) },
      isLoaded:  true,
    });
  },

  saveData: async () => {
    const { tasks, dailyLogs, streak, settings } = get();
    await saveStorage({ tasks, dailyLogs, streak, settings });
  },

  exportData: async () => {
    const { tasks, dailyLogs, streak, settings } = get();
    return exportToFile({ tasks, dailyLogs, streak, settings });
  },

  importData: async (uri) => {
    const data = await importFromFile(uri);
    if (!data) return false;
    set({
      tasks:     data.tasks     || [],
      dailyLogs: data.dailyLogs || {},
      streak:    data.streak    || { current: 0, longest: 0, lastDate: null },
      settings:  { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    });
    await get().saveData();
    return true;
  },

  resetData: async () => {
    set({ tasks: [], dailyLogs: {}, streak: { current: 0, longest: 0, lastDate: null }, activeSession: null });
    await get().saveData();
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  addTask: async (data) => {
    const task = {
      id:         genId(),
      name:       data.name       || 'New Task',
      duration:   data.duration   !== undefined ? data.duration   : 60,
      breakAfter: data.breakAfter !== undefined ? data.breakAfter : 0,
      category:   data.category   || 'work',
      color:      data.color      || '#7C3AED',
      order:      get().tasks.length,
      createdAt:  new Date().toISOString(),
    };
    set(s => ({ tasks: [...s.tasks, task] }));
    await get().saveData();
    return task.id;
  },

  updateTask: async (id, updates) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
    await get().saveData();
  },

  deleteTask: async (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i })) }));
    await get().saveData();
  },

  reorderTasks: async (ordered) => {
    set({ tasks: ordered.map((t, i) => ({ ...t, order: i })) });
    await get().saveData();
  },

  // ── Session ────────────────────────────────────────────────────────────────
  startSession: (taskId, isBreak = false) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const mins = isBreak ? (task.breakAfter || 10) : task.duration;
    const now  = Date.now();
    set({ activeSession: {
      taskId, isBreak,
      startTime: now, endTime: now + mins * 60000,
      isPaused: false, pausedAt: null,
    }});
  },

  pauseSession: () => set(s => {
    if (!s.activeSession || s.activeSession.isPaused) return s;
    return { activeSession: { ...s.activeSession, isPaused: true, pausedAt: Date.now() } };
  }),

  resumeSession: () => set(s => {
    if (!s.activeSession || !s.activeSession.isPaused) return s;
    const extra = Date.now() - s.activeSession.pausedAt;
    return { activeSession: { ...s.activeSession, isPaused: false, pausedAt: null, endTime: s.activeSession.endTime + extra } };
  }),

  completeSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    set({ activeSession: null });
    if (!session.isBreak) {
      const today = todayKey();
      set(s => {
        const log = { ...emptyLog(), ...(s.dailyLogs[today] || {}) };
        if (log.completed.includes(session.taskId)) return s;
        return { dailyLogs: { ...s.dailyLogs, [today]: { ...log, completed: [...log.completed, session.taskId] } } };
      });
      // Recalculate streak from scratch
      const { dailyLogs, tasks } = get();
      const newStreak = recalcStreak(dailyLogs, tasks);
      set({ streak: newStreak });
      await get().saveData();
    }
  },

  skipSession: async () => {
    const session = get().activeSession;
    if (!session) return;
    set({ activeSession: null });
    if (!session.isBreak) {
      const today = todayKey();
      set(s => {
        const log = { ...emptyLog(), ...(s.dailyLogs[today] || {}) };
        if (log.skipped.includes(session.taskId)) return s;
        return { dailyLogs: { ...s.dailyLogs, [today]: { ...log, skipped: [...log.skipped, session.taskId] } } };
      });
      await get().saveData();
    }
  },

  addNote: async ({ taskId, text, voicePath = null }) => {
    const today = todayKey();
    const note  = { id: genId(), text, voicePath, timestamp: new Date().toISOString() };
    set(s => {
      const log = { ...emptyLog(), ...(s.dailyLogs[today] || {}) };
      return { dailyLogs: { ...s.dailyLogs, [today]: { ...log, notes: { ...log.notes, [taskId]: [...(log.notes[taskId] || []), note] } } } };
    });
    await get().saveData();
  },

  deleteNote: async ({ date, taskId, noteId }) => {
    set(s => {
      const log = s.dailyLogs[date];
      if (!log) return s;
      return { dailyLogs: { ...s.dailyLogs, [date]: { ...log, notes: { ...log.notes, [taskId]: (log.notes[taskId] || []).filter(n => n.id !== noteId) } } } };
    });
    await get().saveData();
  },

  updateSettings: async (updates) => {
    set(s => ({ settings: { ...s.settings, ...updates } }));
    await get().saveData();
  },
}));
