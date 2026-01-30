
export type Frequency = 'daily' | 'weekly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: string;
  createdAt: string;
  type: 'task';
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: Frequency;
  selectedDays: number[]; // 0-6 (Sun-Sat)
  goalDays: number;
  completions: string[]; // ISO Date strings (YYYY-MM-DD)
  createdAt: string;
  type: 'habit';
}

export type Item = Task | Habit;

export interface AppState {
  tasks: Task[];
  habits: Habit[];
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
}
