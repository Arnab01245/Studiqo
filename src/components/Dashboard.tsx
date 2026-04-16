/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Brain, Flame, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProductivityStats, StudySession } from '../types';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  stats: ProductivityStats;
  sessions: StudySession[];
}

export default function Dashboard({ stats, sessions }: DashboardProps) {
  const chartData = sessions.slice(-7).map((s, i) => ({
    name: `Session ${i + 1}`,
    focus: s.focusScore,
    intensity: s.intensity * 10,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Burnout Risk Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Burnout Risk</p>
            <h3 className="text-4xl font-black text-white">{stats.burnoutRisk}%</h3>
          </div>
          <div className={cn(
            "p-3 rounded-2xl border",
            stats.burnoutRisk > 70 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          )}>
            <Flame size={24} />
          </div>
        </div>
        <div className="mt-8 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.burnoutRisk}%` }}
            className={cn(
              "h-full transition-all duration-1000",
              stats.burnoutRisk > 70 ? 'bg-red-400' : stats.burnoutRisk > 40 ? 'bg-slate-400' : 'bg-emerald-400'
            )}
          />
        </div>
      </motion.div>

      {/* Focus Score Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Avg Focus</p>
            <h3 className="text-4xl font-black text-white">{stats.averageFocus}%</h3>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white">
            <Brain size={24} />
          </div>
        </div>
        <div className="mt-8 flex items-center gap-2">
          {stats.focusTrend === 'up' && <TrendingUp className="text-emerald-400" size={20} />}
          {stats.focusTrend === 'down' && <TrendingDown className="text-red-400" size={20} />}
          {stats.focusTrend === 'stable' && <Minus className="text-slate-500" size={20} />}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trend: {stats.focusTrend}</span>
        </div>
      </motion.div>

      {/* Study Time Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Study Hours</p>
            <h3 className="text-4xl font-black text-white">{(stats.totalStudyTime / 3600).toFixed(1)}h</h3>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white">
            <Activity size={24} />
          </div>
        </div>
        <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-widest">Total Active Focus</p>
      </motion.div>

      {/* Recommended Target */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 flex flex-col justify-between"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Daily Goal</p>
            <h3 className="text-4xl font-black text-white">85%</h3>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white">
            <Target size={24} />
          </div>
        </div>
        <p className="mt-8 text-xs font-bold text-slate-500 uppercase tracking-widest">Target for finals</p>
      </motion.div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="md:col-span-2 lg:col-span-4 glass-card p-10 h-[400px]"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <h4 className="text-xl font-black text-white tracking-tight">Productivity Trends</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Consistency Analysis</p>
          </div>
          <div className="flex gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"></div> Focus
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div> Intensity
            </div>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '20px',
                  padding: '12px 16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ stroke: 'white', strokeWidth: 1, strokeDasharray: '4' }}
              />
              <Area type="monotone" dataKey="focus" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
              <Area type="monotone" dataKey="intensity" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorInt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
