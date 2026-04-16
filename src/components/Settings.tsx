/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Camera, Save, CheckCircle2, Trash2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function Settings({ profile, onUpdateProfile }: SettingsProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for localStorage safety
        alert("Image should be less than 1MB to avoid storage issues.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatarUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, avatarUrl: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      onUpdateProfile(formData);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-12 py-8 text-slate-200">
      <div className="flex flex-col gap-3 ml-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Vault Settings</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Personalize your focus environment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Profile Identity Card */}
        <div className="md:col-span-4 space-y-8">
          <div className="glass-panel p-10 flex flex-col items-center text-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-slate-800 overflow-hidden border-2 border-white/20 p-1.5 shadow-2xl transition-all duration-700 group-hover:border-white/40">
                <img 
                  src={formData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.avatarSeed}`} 
                  alt="Avatar Preview" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 cursor-pointer backdrop-blur-sm"
              >
                <Camera className="text-white" size={28} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-black text-2xl text-white tracking-tight uppercase">{formData.name || 'ANONYMOUS'}</h3>
              <div className="glass-pill text-slate-500 border-white/5 mx-auto w-fit">
                {formData.membershipStatus}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full pt-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                <Upload size={14} /> Update Identity
              </button>
              {formData.avatarUrl && (
                <button 
                  type="button"
                  onClick={removeImage}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  <Trash2 size={14} /> Reset Avatar
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="glass-panel p-8">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <Shield size={16} /> Encryption Status
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                <span className="text-slate-500">Cloud Sync</span>
                <span className="text-emerald-400">Secured</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                <span className="text-slate-500">Biometrics</span>
                <span className="text-slate-700">Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="md:col-span-8">
          <form onSubmit={handleSubmit} className="glass-panel p-12 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 flex items-center gap-2">
                   Display Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Identity Name"
                  className="glass-input w-full p-4"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 flex items-center gap-2">
                   Linked Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@nexus.com"
                  className="glass-input w-full p-4"
                  required
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-6 flex items-center gap-2">
                   Avatar Seed
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={formData.avatarSeed}
                    onChange={(e) => setFormData({ ...formData, avatarSeed: e.target.value })}
                    placeholder="Generation Seed"
                    className="glass-input flex-1 p-4"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarSeed: Math.random().toString(36).substring(7) })}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Regen
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center gap-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-12 py-5 bg-white hover:bg-white/90 text-black rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>{isSaving ? 'Encrypting...' : 'Save Vault'}</span>
              </button>

              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
                >
                  <CheckCircle2 size={16} /> Changes Persistent
                </motion.div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
