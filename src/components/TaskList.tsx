/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Check, Trash2, Clock, Star } from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string, subject: string, priority: Task['priority']) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({ tasks, onAddTask, onToggleTask, onDeleteTask }: TaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle, newSubject || 'General', priority);
    setNewTitle('');
    setNewSubject('');
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            STUDY QUEUE
          </h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Organize your focus sessions</p>
        </div>
        <div className="glass-pill text-slate-400 border-white/5">
          {activeTasks.length} Active
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 space-y-4 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5">Task Title</label>
            <input
              type="text"
              placeholder="What are we studying?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5">Subject Tag</label>
            <input
              type="text"
              placeholder="Mathematics, Physics..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="glass-input w-full"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/5">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  priority === p 
                    ? "bg-white text-black shadow-lg" 
                    : "text-slate-500 hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          
          <button
            type="submit"
            className="w-full md:w-auto md:ml-auto px-10 py-4 bg-white hover:bg-white/90 text-black rounded-full font-black text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Add Focus Task</span>
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
        {/* Active Tasks */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group flex items-center gap-6 p-6 glass-card bg-white/[0.03] hover:bg-white/[0.06] border-white/5 rounded-[32px]"
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="w-7 h-7 rounded-full border-2 border-white/10 flex items-center justify-center transition-all group-hover:border-white/30"
                >
                  <div className="w-3 h-3 rounded-full bg-white opacity-0 transition-opacity" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-black text-white truncate tracking-tight uppercase">{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.subject}</span>
                    <div className={cn(
                      "w-1 h-3 rounded-full",
                      task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-slate-500' : 'bg-emerald-400'
                    )} />
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Archived Section Header */}
        {completedTasks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-4">Archived Sessions</h3>
            <div className="space-y-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-6 p-5 rounded-[28px] bg-white/[0.01] border border-white/5">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center transition-all"
                  >
                    <Check size={16} className="text-black font-black" />
                  </button>
                  <span className="text-base font-bold line-through text-slate-500 truncate tracking-tight">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tasks.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center opacity-20">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5 mb-6">
              <Plus size={40} className="text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Input</p>
          </div>
        )}
      </div>
    </div>
  );
}
