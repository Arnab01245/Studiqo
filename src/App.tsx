/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Brain, LayoutDashboard, Calendar, History, ShieldAlert, Cpu, Activity, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import PomodoroTimer from './components/PomodoroTimer';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { Task, StudySession, ProductivityStats, UserProfile } from './types';
import { analyzeStudyPatterns } from './services/geminiService';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'insights' | 'settings'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    burnoutRisk: number;
    insights: string[];
    suggestedFocus: string;
    focusScore: number;
  } | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'New User',
    email: '',
    avatarSeed: 'student',
    membershipStatus: 'Pro Member'
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const userId = session?.user?.id;

  // Stats calculation
  const stats = useMemo(() => {
    const totalStudyTime = sessions.reduce((acc, s) => acc + s.duration, 0);
    const avgFocus = sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length) : 0;
    const burnoutRisk = aiInsights?.burnoutRisk || 15;
    
    // Simple trend detection
    let focusTrend: 'up' | 'down' | 'stable' = 'stable';
    if (sessions.length > 5) {
      const recent = sessions.slice(-3).reduce((acc, s) => acc + s.focusScore, 0) / 3;
      const older = sessions.slice(-6, -3).reduce((acc, s) => acc + s.focusScore, 0) / 3;
      if (recent > older + 5) focusTrend = 'up';
      else if (recent < older - 5) focusTrend = 'down';
    }

    return { totalStudyTime, averageFocus: avgFocus, burnoutRisk, focusTrend } as ProductivityStats;
  }, [sessions, aiInsights]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const initializeData = async () => {
      setSyncing(true);
      
      try {
        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!profileError && profileData) {
          setUserProfile({
            name: profileData.name,
            email: profileData.email,
            avatarSeed: profileData.avatar_seed,
            avatarUrl: profileData.avatar_url,
            membershipStatus: profileData.membership_status as any
          });
        } else if (profileError?.code === 'PGRST116') {
          // Create default profile if not found
          await supabase.from('profiles').insert([{ 
            id: userId,
            name: session?.user?.email?.split('@')[0] || 'User',
            email: session?.user?.email || '',
            avatar_seed: 'student',
            membership_status: 'Pro Member'
          }]);
        }

        // 2. Fetch Tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        
        if (tasksData && tasksData.length > 0) {
          setTasks(tasksData.map(t => ({
            id: t.id,
            title: t.title,
            subject: t.subject,
            completed: t.completed,
            dueDate: t.due_date,
            priority: t.priority
          })));
        } else {
          setTasks([]);
        }

        // 3. Fetch Sessions
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId);

        if (sessionsData && sessionsData.length > 0) {
          setSessions(sessionsData.map(s => ({
            id: s.id,
            startTime: s.start_time,
            duration: s.duration,
            intensity: s.intensity,
            focusScore: s.focus_score,
            taskId: s.task_id
          })));
        } else {
          setSessions([]);
        }

        setLastSynced(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to sync with Supabase:', err);
      } finally {
        setSyncing(false);
      }
    };

    initializeData();
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('study-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('study-sessions', JSON.stringify(sessions));
    if (sessions.length > 0 && sessions.length % 3 === 0) {
      refreshAI();
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('study-profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const refreshAI = async () => {
    setLoadingInsights(true);
    const result = await analyzeStudyPatterns(sessions, tasks);
    setAiInsights(result);
    setLoadingInsights(false);
  };

  const updateProfile = async (newProfile: UserProfile) => {
    if (!userId) return;
    setUserProfile(newProfile);
    await supabase.from('profiles').update({
      name: newProfile.name,
      email: newProfile.email,
      avatar_seed: newProfile.avatarSeed,
      avatar_url: newProfile.avatarUrl,
      membership_status: newProfile.membershipStatus
    }).eq('id', userId);
  };

  const handleSessionComplete = async (duration: number) => {
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      startTime: new Date().toISOString(),
      duration,
      intensity: 7,
      focusScore: 80 + Math.random() * 20,
    };
    
    if (!userId) return;
    setSessions([...sessions, newSession]);
    
    await supabase.from('sessions').insert([{
      id: newSession.id,
      user_id: userId,
      start_time: newSession.startTime,
      duration: newSession.duration,
      intensity: newSession.intensity,
      focus_score: newSession.focusScore
    }]);
  };

  const addTask = async (title: string, subject: string, priority: Task['priority']) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      subject,
      priority,
      completed: false,
      dueDate: new Date().toISOString(),
    };
    
    if (!userId) return;
    setTasks([...tasks, newTask]);
    
    await supabase.from('tasks').insert([{
      id: newTask.id,
      user_id: userId,
      title: newTask.title,
      subject: newTask.subject,
      priority: newTask.priority,
      completed: newTask.completed,
      due_date: newTask.dueDate
    }]);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newCompleted = !task.completed;
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    
    await supabase.from('tasks')
      .update({ completed: newCompleted })
      .eq('id', id);
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden text-slate-200">
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 glass-panel m-4 flex flex-col items-center md:items-stretch py-8 px-4 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg border border-white/20">
            <Brain className="text-white w-6 h-6" />
          </div>
          <span className="hidden md:block text-xl font-black tracking-tighter text-white">
            FOCUS FLOW
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'planner', label: 'Study Planner', icon: Calendar },
            { id: 'insights', label: 'AI Analysis', icon: Sparkles },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all",
                activeTab === item.id 
                  ? "bg-white/10 text-white shadow-lg border border-white/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              <span className="hidden md:block font-bold tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto bg-white/[0.03] p-4 rounded-[24px] border border-white/5">
          <div className="hidden md:flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/20 shadow-inner">
              <img src={userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.avatarSeed}`} alt="User" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-white">{userProfile.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{userProfile.membershipStatus}</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "hidden md:block w-full text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all mb-2",
              activeTab === 'settings' 
                ? "bg-white/20 text-white border border-white/20" 
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            )}
          >
            Settings
          </button>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="hidden md:flex items-center justify-center gap-2 w-full text-center py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              Hello, {userProfile.name.split(' ')[0]} <Sparkles className="inline text-white/40 h-6 w-6 ml-2" />
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-bold">You have {tasks.filter(t => !t.completed).length} focus items remaining today.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="glass-panel px-4 py-2.5 flex items-center gap-3 border-white/5">
              <div className={cn("w-2 h-2 rounded-full", syncing ? "bg-white animate-pulse" : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {syncing ? "Syncing..." : lastSynced ? `Linked ${lastSynced}` : "Cloud Active"}
              </span>
            </div>
            <div className="glass-panel px-4 py-2.5 flex items-center gap-3 border-white/5">
              <ShieldAlert className={cn(stats.burnoutRisk > 60 ? "text-red-400" : "text-slate-500")} size={18} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Risk: {stats.burnoutRisk > 60 ? "Elevated" : "Low"}
              </span>
            </div>
            <button 
              onClick={refreshAI}
              disabled={loadingInsights}
              className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center gap-2 group"
            >
              <Sparkles className={cn("group-hover:text-white transition-colors", loadingInsights && "animate-spin")} size={18} />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white">Analyze</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <Dashboard stats={stats} sessions={sessions} />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <PomodoroTimer onSessionComplete={handleSessionComplete} />
                  
                  {/* AI Quick Insight */}
                  <div className="glass-card p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <h4 className="flex items-center gap-2 font-bold mb-2">
                      <Cpu size={18} className="text-purple-400" /> AI Coach Recommendation
                    </h4>
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      "{aiInsights?.suggestedFocus || "Maintain consistency. You're entering a high-productivity window."}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1"
            >
              <div className="lg:col-span-8 glass-panel p-6">
                <TaskList 
                  tasks={tasks}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass-panel p-6">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History size={20} className="text-slate-400" /> Recent Activity
                  </h4>
                  <div className="space-y-4">
                    {sessions.slice(-5).reverse().map(session => (
                      <div key={session.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-2 h-8 rounded-full bg-purple-500/50" />
                        <div className="flex-1">
                          <p className="text-xs font-bold tracking-tight">Deep Work Session</p>
                          <p className="text-[10px] text-slate-500 uppercase">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {Math.round(session.duration / 60)} mins</p>
                        </div>
                        <div className="text-xs font-mono text-purple-400">
                          {Math.round(session.focusScore)}%
                        </div>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-8">No sessions logged yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              className="flex-1 flex flex-col gap-8 py-8"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="w-20 h-20 bg-purple-500/20 rounded-3xl mx-auto flex items-center justify-center border border-purple-500/30">
                  <Sparkles size={40} className="text-purple-400 animate-pulse" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">Smart Burnout Diagnostics</h2>
                <p className="text-slate-400">Our AI analyzes your study rhythms to prevent exhaustion before it happens.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Activity size={24} className="text-emerald-400" /> Behavior Analysis
                  </h3>
                  <div className="space-y-4">
                    {(aiInsights?.insights || [
                      "Consistent study times observed.",
                      "Brake frequency is optimal for current intensity.",
                      "High focus during morning sessions noted."
                    ]).map((insight, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="glass-card p-5 border-l-4 border-emerald-500 bg-emerald-500/5"
                      >
                        <p className="text-sm leading-relaxed">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Flame size={24} className="text-red-400" /> Stress Indicators
                  </h3>
                  <div className="glass-panel p-8 flex flex-col items-center justify-center text-center gap-6">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <motion.circle 
                          cx="96" cy="96" r="88" 
                          fill="none" 
                          stroke={stats.burnoutRisk > 60 ? "#ef4444" : "#10b981"} 
                          strokeWidth="12" 
                          strokeDasharray="552.92"
                          initial={{ strokeDashoffset: 552.92 }}
                          animate={{ strokeDashoffset: 552.92 - (552.92 * stats.burnoutRisk / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-black">{stats.burnoutRisk}%</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Risk Score</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">
                        {stats.burnoutRisk > 70 ? "Danger Zone" : stats.burnoutRisk > 40 ? "Warning" : "Safe Zone"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                        {stats.burnoutRisk > 70 
                          ? "Take an immediate 24-hour disconnect. Productivity is dropping." 
                          : "Maintain your current pace. Your break frequency is keeping you sharp."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col pt-4"
            >
              <Settings profile={userProfile} onUpdateProfile={updateProfile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global CSS for scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
