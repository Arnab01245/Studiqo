/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PomodoroTimerProps {
  onSessionComplete: (duration: number) => void;
}

export default function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    if (mode === 'study') {
      onSessionComplete(25 * 60);
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('study');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'study' ? (25 * 60 - timeLeft) / (25 * 60) : (5 * 60 - timeLeft) / (5 * 60);

  return (
    <div className="glass-panel p-10 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[400px]">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
      
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className={cn(
          "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700",
          mode === 'study' ? "bg-white/5 border-white/20 text-white" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        )}>
          {mode === 'study' ? (
            <Brain className={cn("w-8 h-8", isActive && "animate-pulse")} />
          ) : (
            <Coffee className={cn("w-8 h-8", isActive && "animate-pulse")} />
          )}
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-500">
            {mode === 'study' ? 'Deep Work Session' : 'Refuel Interval'}
          </span>
        </div>
      </div>

      <div className="text-[120px] font-black tracking-[-0.08em] leading-none mb-12 tabular-nums text-white">
        {formatTime(timeLeft)}
      </div>

      {/* Progress Track */}
      <div className="w-full max-w-[300px] h-1.5 bg-white/5 rounded-full overflow-hidden mb-12 border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          className={cn(
            "h-full shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-1000",
            mode === 'study' ? "bg-white" : "bg-emerald-400"
          )}
        />
      </div>

      <div className="flex gap-6">
        <button
          onClick={toggleTimer}
          className={cn(
            "px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3",
            isActive 
              ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" 
              : "bg-white text-black hover:bg-white/90"
          )}
        >
          {isActive ? (
            <>
              <Pause size={18} className="fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play size={18} className="fill-current ml-1" />
              <span>Start Focus</span>
            </>
          )}
        </button>
        
        <button
          onClick={resetTimer}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all shadow-xl group"
        >
          <RotateCcw size={20} className="group-hover:rotate-[-90deg] transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
}
