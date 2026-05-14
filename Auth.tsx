import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, rtdb } from '../lib/firebase';
import { useAppStore } from '../store';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export function AuthPortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referrerUid, setReferrerUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useAppStore();

  useEffect(() => {
    // Capture Referrer UID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    if (refId) setReferrerUid(refId);
  }, []);

  const getRandomColor = () => {
    const colors = ['#FFD700', '#FF3366', '#33CCFF', '#9933FF', '#00FF99'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Authentication Successful');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Initialize User Profile in RTDB
        await set(ref(rtdb, `users/${user.uid}`), {
          uid: user.uid,
          name: name || 'User',
          email: user.email,
          balance: 0,
          totalWithdraw: 0,
          todayReferrals: 0,
          isVerified: false,
          referrerUid: referrerUid,
          lastClaimDate: null,
          avatarColor: getRandomColor()
        });

        // Instant Referrer Reward Logic (Conceptual, handled server-side ideally, but doing basic structure here)
        showToast('Registration Successful');
      }
    } catch (error: any) {
      showToast(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-64 h-64 bg-slate/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-panel p-8 rounded-[2rem] border-white/5 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)]">
            <Shield className="text-black w-8 h-8" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">CrazyHube</h1>
        <p className="text-slate text-center text-sm mb-8">Premium Earning Portal</p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate/50 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          )}
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate/50 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Secure Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate/50 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full gold-gradient py-4 rounded-xl font-bold text-black shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'PROCESSING...' : isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate text-sm hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
