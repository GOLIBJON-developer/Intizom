import { format } from 'date-fns';

export const todayKey = () => format(new Date(), 'yyyy-MM-dd');

export const selectTodayProgress = (tasks, dailyLogs) => {
  const today = todayKey();
  const log = dailyLogs[today] || { completed: [], skipped: [] };
  const nonBreak = tasks.filter(t => t.category !== 'break');
  return {
    completed: log.completed?.length || 0,
    total:     nonBreak.length,
    skipped:   log.skipped?.length || 0,
  };
};

export const selectNextTask = (tasks, dailyLogs) => {
  const today = todayKey();
  const log = dailyLogs[today] || { completed: [], skipped: [] };
  const done = [...(log.completed || []), ...(log.skipped || [])];
  return tasks
    .filter(t => t.category !== 'break')
    .sort((a, b) => a.order - b.order)
    .find(t => !done.includes(t.id)) || null;
};

export const selectAllNotes = (tasks, dailyLogs) => {
  const result = [];
  Object.entries(dailyLogs).forEach(([date, log]) => {
    Object.entries(log.notes || {}).forEach(([taskId, notes]) => {
      const task = tasks.find(t => t.id === taskId);
      (notes || []).forEach(note => {
        result.push({ ...note, date, taskId, taskName: task?.name || 'Unknown' });
      });
    });
  });
  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const selectWeeklyStats = (dailyLogs) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = format(d, 'yyyy-MM-dd');
    const log = dailyLogs[key] || { completed: [] };
    days.push({ date: key, label: format(d, 'EEE'), completed: log.completed?.length || 0 });
  }
  return days;
};
