/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      {/* Subtle overlay to enhance contrast without obscuring the image */}
      <div className="absolute inset-0 bg-black/30" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden">
          <h2 className="text-3xl font-bold text-white text-center mb-10 tracking-wide">
            {isLogin ? 'Login' : 'Register'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-200 text-xs font-medium"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {/* Email / Username Input */}
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-transparent border border-white/30 rounded-full py-3.5 px-6 text-white placeholder:text-white/50 text-base focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
                />
                <User 
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-white transition-colors" 
                  size={20} 
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent border border-white/30 rounded-full py-3.5 px-6 text-white placeholder:text-white/50 text-base focus:outline-none focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
                />
                <Lock 
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-white transition-colors" 
                  size={20} 
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-white/30 bg-transparent text-white focus:ring-0 focus:ring-offset-0" 
                />
                <span className="text-white text-sm font-medium group-hover:text-white/80 transition-colors">Remember Me</span>
              </label>
              <button 
                type="button"
                className="text-white text-sm font-medium hover:underline transition-all"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-white/90 text-black font-extrabold rounded-full text-base shadow-xl transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-50 mt-8"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                'Submit'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 px-2 flex items-center gap-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-white/30 text-[10px] font-black uppercase tracking-widest leading-none">OR</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Social Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full text-sm shadow-xl transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5 opacity-80" 
            />
            <span>Sign in with Google</span>
          </button>

          {/* Footer Toggle */}
          <div className="mt-8 text-center text-white text-sm font-medium">
            <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold hover:underline ml-1"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
