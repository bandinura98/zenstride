
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Home, 
  BarChart2, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  Flame, 
  Calendar,
  ChevronRight,
  Trash2,
  Moon,
  Sun,
  Bell,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Task, Habit, AppState, Item } from './types';
import { getTodayStr, calculateStreak, getWeekStats } from './utils';
import { getMotivationalCoach } from './geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

// --- Sub-components ---

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
    <div 
      className="bg-indigo-600 h-full transition-all duration-500 ease-out"
      style={{ width: `${Math.min(100, progress)}%` }}
    />
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <CheckCircle2 size={48} className="mb-4 opacity-20" />
    <p>{message}</p>
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const savedTasks = localStorage.getItem('zenstride_tasks');
    const savedHabits = localStorage.getItem('zenstride_habits');
    const savedTheme = localStorage.getItem('zenstride_theme') as 'light' | 'dark';
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('zenstride_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zenstride_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('zenstride_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-900', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-900', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
  }, [theme]);

  const fetchAiInsight = async () => {
    setIsLoadingAi(true);
    const insight = await getMotivationalCoach(habits, tasks);
    setAiInsight(insight);
    setIsLoadingAi(false);
  };

  const addTask = (title: string, description: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      completed: false,
      dueDate: getTodayStr(),
      createdAt: new Date().toISOString(),
      type: 'task'
    };
    setTasks([newTask, ...tasks]);
    setIsAddModalOpen(false);
  };

  const addHabit = (title: string, description: string, frequency: 'daily' | 'weekly', goalDays: number) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title,
      description,
      frequency,
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      goalDays,
      completions: [],
      createdAt: new Date().toISOString(),
      type: 'habit'
    };
    setHabits([newHabit, ...habits]);
    setIsAddModalOpen(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const toggleHabitCompletion = (id: string) => {
    const today = getTodayStr();
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completions.includes(today);
        const newCompletions = isCompleted 
          ? h.completions.filter(d => d !== today)
          : [...h.completions, today];
        return { ...h, completions: newCompletions };
      }
      return h;
    }));
  };

  const deleteItem = (id: string, type: 'task' | 'habit') => {
    if (type === 'task') {
      setTasks(prev => prev.filter(t => t.id !== id));
    } else {
      setHabits(prev => prev.filter(h => h.id !== id));
      if (selectedHabitId === id) setSelectedHabitId(null);
    }
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setTasks([]);
      setHabits([]);
      localStorage.clear();
    }
  };

  // --- Renderers ---

  const renderHome = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const totalItems = tasks.length + habits.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completedHabitsToday = habits.filter(h => h.completions.includes(getTodayStr())).length;
    const totalCompletedToday = completedTasks + completedHabitsToday;
    const progressPercent = totalItems > 0 ? (totalCompletedToday / totalItems) * 100 : 0;

    return (
      <div className="flex flex-col gap-6 pb-24">
        {/* Header Section */}
        <section className="px-1">
          <p className="text-slate-500 dark:text-slate-400 font-medium">{today}</p>
          <h1 className="text-3xl font-bold font-outfit mt-1">Hello, Striker!</h1>
        </section>

        {/* Progress Card */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Daily Progress</p>
              <h2 className="text-2xl font-bold font-outfit">{totalCompletedToday}/{totalItems} Completed</h2>
            </div>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{Math.round(progressPercent)}%</span>
          </div>
          <ProgressBar progress={progressPercent} />
        </section>

        {/* AI Insight */}
        <section className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">Smart Coach</h4>
              <button 
                onClick={fetchAiInsight}
                className="text-indigo-600 dark:text-indigo-400 hover:rotate-180 transition-transform duration-500"
              >
                <RefreshCw size={14} className={isLoadingAi ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-indigo-800/80 dark:text-indigo-300/80 text-sm mt-1 leading-relaxed italic">
              {aiInsight || "Tap the refresh icon for a personalized AI insight based on your current progress!"}
            </p>
          </div>
        </section>

        {/* Habits List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <Flame size={20} className="text-orange-500" />
              Daily Habits
            </h3>
          </div>
          <div className="space-y-3">
            {habits.length === 0 ? (
              <EmptyState message="No habits tracked. Add your first habit!" />
            ) : (
              habits.map(habit => {
                const streak = calculateStreak(habit.completions);
                const isDone = streak.isCompletedToday;
                return (
                  <div 
                    key={habit.id} 
                    className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isDone 
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-75' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'
                    }`}
                    onClick={() => setSelectedHabitId(habit.id)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleHabitCompletion(habit.id); }}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isDone 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      {isDone && <CheckCircle2 size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isDone ? 'line-through text-slate-400' : ''}`}>{habit.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Flame size={12} className="text-orange-500" />
                          {streak.currentStreak} day streak
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {habit.frequency}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Tasks List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <CheckCircle2 size={20} className="text-indigo-500" />
              Today's Tasks
            </h3>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <EmptyState message="All caught up! Add a new task." />
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                    task.completed 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-75' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
                    }`}
                  >
                    {task.completed && <CheckCircle2 size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
                    {task.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>}
                  </div>
                  <button 
                    onClick={() => deleteItem(task.id, 'task')}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderStats = () => {
    const weekData = getWeekStats(habits);
    const totalCompletions = habits.reduce((acc, h) => acc + h.completions.length, 0);
    const longestStreakOverall = Math.max(0, ...habits.map(h => calculateStreak(h.completions).longestStreak));

    return (
      <div className="flex flex-col gap-6 pb-24">
        <section className="px-1">
          <h1 className="text-3xl font-bold font-outfit mt-1">Insights</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Your progress at a glance</p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 p-2 rounded-xl w-fit mb-3">
              <Flame size={20} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Longest Streak</p>
            <p className="text-2xl font-bold font-outfit mt-1">{longestStreakOverall} Days</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 p-2 rounded-xl w-fit mb-3">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Completions</p>
            <p className="text-2xl font-bold font-outfit mt-1">{totalCompletions}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <h3 className="text-lg font-bold font-outfit mb-6">Weekly Activity</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="completions" radius={[8, 8, 8, 8]} barSize={32}>
                  {weekData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 6 ? '#4f46e5' : '#e2e8f0'} 
                      className="dark:fill-slate-700"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold font-outfit">Habit Performance</h3>
          {habits.map(h => {
            const streak = calculateStreak(h.completions);
            const progress = (h.completions.length / h.goalDays) * 100;
            return (
              <div key={h.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{h.title}</span>
                  <span className="text-xs font-medium text-slate-400">{h.completions.length}/{h.goalDays} Goal</span>
                </div>
                <ProgressBar progress={progress} />
                <div className="flex justify-between mt-3 text-xs text-slate-500">
                  <span>Current: {streak.currentStreak}d</span>
                  <span>Longest: {streak.longestStreak}d</span>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="flex flex-col gap-6 pb-24">
      <section className="px-1">
        <h1 className="text-3xl font-bold font-outfit mt-1">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your preferences</p>
      </section>

      <section className="space-y-4">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div className="text-left">
                <p className="font-semibold">Appearance</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{theme} Mode</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                <Bell size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold">Notifications</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Enabled</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <button 
            onClick={resetAll}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-lg text-red-600">
                <RefreshCw size={20} />
              </div>
              <p className="font-semibold">Reset App Data</p>
            </div>
          </button>
        </div>
      </section>

      <section className="text-center py-6">
        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">ZenStride v1.0.0</p>
        <p className="text-xs text-slate-400 mt-1">Made with ❤️ for productivity</p>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 relative">
      {/* Dynamic Content */}
      <main className="p-6">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Floating Action Button */}
      {activeTab === 'home' && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed right-6 bottom-24 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-700/50 p-4 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <SettingsIcon size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
        </button>
      </nav>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <AddForm 
          onAddTask={addTask} 
          onAddHabit={addHabit} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      </Modal>

      {/* Habit Detail Modal */}
      <Modal isOpen={!!selectedHabitId} onClose={() => setSelectedHabitId(null)}>
        {selectedHabitId && (
          <HabitDetail 
            habit={habits.find(h => h.id === selectedHabitId)!} 
            onClose={() => setSelectedHabitId(null)}
            onDelete={() => deleteItem(selectedHabitId, 'habit')}
          />
        )}
      </Modal>
    </div>
  );
}

// --- Internal Helper Components ---

const AddForm: React.FC<{ 
  onAddTask: (t: string, d: string) => void; 
  onAddHabit: (t: string, d: string, f: 'daily' | 'weekly', g: number) => void;
  onClose: () => void;
}> = ({ onAddTask, onAddHabit, onClose }) => {
  const [type, setType] = useState<'task' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [freq, setFreq] = useState<'daily' | 'weekly'>('daily');
  const [goal, setGoal] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === 'task') onAddTask(title, desc);
    else onAddHabit(title, desc, freq, goal);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-outfit">Add New Item</h2>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <Trash2 size={20} className="rotate-45" />
        </button>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl mb-6">
        <button 
          type="button"
          onClick={() => setType('task')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${type === 'task' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Task
        </button>
        <button 
          type="button"
          onClick={() => setType('habit')}
          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${type === 'habit' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Habit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder={type === 'task' ? "e.g., Buy groceries" : "e.g., Read 30 mins"}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Description (Optional)</label>
          <textarea 
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            rows={3}
          />
        </div>

        {type === 'habit' && (
          <>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Frequency</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setFreq('daily')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${freq === 'daily' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  Daily
                </button>
                <button 
                  type="button" 
                  onClick={() => setFreq('weekly')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${freq === 'weekly' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Target Goal (Days)</label>
              <input 
                type="number" 
                value={goal}
                onChange={e => setGoal(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </>
        )}
      </div>

      <button 
        type="submit"
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl mt-8 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
      >
        Create {type === 'task' ? 'Task' : 'Habit'}
      </button>
    </form>
  );
};

const HabitDetail: React.FC<{ habit: Habit; onClose: () => void; onDelete: () => void }> = ({ habit, onClose, onDelete }) => {
  const streak = calculateStreak(habit.completions);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-outfit">{habit.title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <Trash2 size={20} className="rotate-45" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl text-center">
          <Flame size={24} className="mx-auto text-orange-500 mb-1" />
          <p className="text-xs text-orange-700 dark:text-orange-300 font-bold uppercase">Current</p>
          <p className="text-2xl font-black font-outfit text-orange-600">{streak.currentStreak}d</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl text-center">
          <Calendar size={24} className="mx-auto text-indigo-500 mb-1" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold uppercase">Longest</p>
          <p className="text-2xl font-black font-outfit text-indigo-600">{streak.longestStreak}d</p>
        </div>
      </div>

      {habit.description && (
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Description</label>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {habit.description}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button 
          onClick={() => { if (confirm('Delete this habit?')) { onDelete(); onClose(); } }}
          className="flex-1 py-3 border-2 border-red-100 dark:border-red-900/20 text-red-600 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          Delete
        </button>
        <button 
          onClick={onClose}
          className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
