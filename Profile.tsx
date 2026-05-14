import { useState, useEffect } from 'react';
import { LogOut, Save, ShieldAlert, BadgeCheck, ExternalLink } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, rtdb } from '../lib/firebase';
import { useAppStore } from '../store';
import { audioService } from '../lib/audio';

export function ProfileScreen() {
  const { profile, showToast } = useAppStore();
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) setEditName(profile.name);
  }, [profile]);

  const handleLogout = async () => {
    audioService.playPop();
    await signOut(auth);
  };

  const handleSaveName = async () => {
    if (!profile || editName.trim() === profile.name) return;
    setIsSaving(true);
    try {
      await update(ref(rtdb, `users/${profile.uid}`), { name: editName.trim() });
      showToast('Profile Updated');
      audioService.playPop();
    } catch (e) {
      showToast('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pt-8 relative">
      
      {/* Header / Avatar */}
      <div className="flex flex-col items-center mb-8 relative">
        <div className="absolute inset-0 top-1/2 -z-10 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-10 w-48 h-48 bg-white/5 blur-[50px] rounded-full pointer-events-none z-[-1]" />
        
        <div 
          className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center font-black text-5xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-white/10 mb-4 transform rotate-3 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${profile?.avatarColor} 0%, #000000 150%)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent mix-blend-overlay" />
          <span className="relative z-10 drop-shadow-lg text-white">
            {profile?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          {profile?.isVerified ? (
            <span className="bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-blue-400 text-xs font-bold px-4 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md">
              <BadgeCheck className="w-4 h-4" /> VERIFIED
            </span>
          ) : (
            <span className="bg-[#0A0A0A] text-slate text-xs font-bold px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-inner">
              <ShieldAlert className="w-4 h-4" /> UNVERIFIED
            </span>
          )}
        </div>
      </div>

      {/* Account Details Form */}
      <div className="bg-[#0A0A0A] p-6 rounded-[2rem] space-y-6 border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] pointer-events-none" />
        
        <div className="relative">
          <label className="text-slate/60 text-[10px] uppercase font-bold tracking-widest mb-2 block pl-2">Display Name</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:outline-none focus:border-white/30 transition-colors shadow-inner"
            />
            <button 
              onClick={handleSaveName}
              disabled={isSaving || editName.trim() === profile?.name}
              className="bg-white text-black p-4 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-30 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:shadow-none"
            >
              <Save className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <label className="text-slate/60 text-[10px] uppercase font-bold tracking-widest mb-2 block pl-2">Registered Email</label>
          <div className="w-full bg-black/30 border border-transparent rounded-2xl px-5 py-4 text-white/50 font-medium">
            {profile?.email}
          </div>
        </div>

        <div className="relative">
          <label className="text-slate/60 text-[10px] uppercase font-bold tracking-widest mb-2 block pl-2">Unique Identity (UID)</label>
          <div className="w-full bg-black/30 border border-transparent rounded-2xl px-5 py-4 text-slate/40 font-mono text-xs overflow-x-auto">
            {profile?.uid}
          </div>
        </div>
      </div>

      {/* Support & Legal */}
      <div className="bg-[#0A0A0A] p-2 rounded-[1.5rem] mt-6 border border-white/5 shadow-2xl">
        <button className="w-full px-5 py-4 flex items-center justify-between text-slate hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <span className="text-xs font-bold uppercase tracking-wider">Terms of Service</span>
          <ExternalLink className="w-4 h-4" />
        </button>
        <div className="w-full h-[1px] bg-white/5 my-1" />
        <button className="w-full px-5 py-4 flex items-center justify-between text-slate hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <span className="text-xs font-bold uppercase tracking-wider">Privacy Policy</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      <div className="pt-6 pb-20 space-y-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600/10 to-red-500/10 text-red-500 py-5 rounded-2xl font-black tracking-widest hover:from-red-600/20 hover:to-red-500/20 border border-red-500/20 transition-all active:scale-[0.98] uppercase text-sm"
        >
          <LogOut className="w-5 h-5" />
          Secure Logout
        </button>
      </div>
    </div>
  );
}
