
import { Habit, StreakData } from './types';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getTodayStr = () => formatDate(new Date());

export const calculateStreak = (completions: string[]): StreakData => {
  if (completions.length === 0) return { currentStreak: 0, longestStreak: 0, isCompletedToday: false };

  const sortedDates = [...new Set(completions)].sort((a, b) => b.localeCompare(a));
  const today = getTodayStr();
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  const isCompletedToday = sortedDates.includes(today);
  const isCompletedYesterday = sortedDates.includes(yesterday);

  if (!isCompletedToday && !isCompletedYesterday) {
    // Streak broken, but we still need longest streak
    return { currentStreak: 0, longestStreak: findLongestStreak(sortedDates), isCompletedToday: false };
  }

  let currentStreak = 0;
  let checkDate = isCompletedToday ? new Date() : new Date(Date.now() - 86400000);

  while (sortedDates.includes(formatDate(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { 
    currentStreak, 
    longestStreak: Math.max(currentStreak, findLongestStreak(sortedDates)), 
    isCompletedToday 
  };
};

const findLongestStreak = (sortedDates: string[]): number => {
  if (sortedDates.length === 0) return 0;
  let max = 0;
  let current = 1;
  
  // We need to sort chronologically for this
  const chrono = [...sortedDates].sort((a, b) => a.localeCompare(b));
  
  for (let i = 1; i < chrono.length; i++) {
    const d1 = new Date(chrono[i-1]);
    const d2 = new Date(chrono[i]);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      current++;
    } else {
      max = Math.max(max, current);
      current = 1;
    }
  }
  return Math.max(max, current);
};

export const getWeekStats = (habits: Habit[]) => {
  const stats = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = habits.filter(h => h.completions.includes(dateStr)).length;
    stats.push({ name: dayName, completions: count });
  }
  return stats;
};
