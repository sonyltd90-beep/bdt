import { useEffect, useState } from 'react';
import { HelpCircle, Bell, BadgeCheck, Copy, Gift, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAppStore } from '../store';
import { audioService } from '../lib/audio';
import { differenceInSeconds, addHours } from 'date-fns';

export function Dashboard() {
  const { profile, showToast, setActiveTab, setVerificationDeposit } = useAppStore();
  // Generate daily seeded fake leaders
  const generateDailyLeaders = () => {
    const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    
    // Simple LCG pseudo-random generator based on day
    const random = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const names = [
      "Jahid Hasan", "Rakib Ahmed", "Sajid Khan", "Tanvir Rahman",
      "Mehedi Hasan", "Nazmul Huda", "Arif Hossain", "Shohag Mia",
      "Robin Islam", "Milon Sheikh", "Tareq Mahmud", "Imran Ali"
    ];

    const leaders = [];
    let seed = today;
    
    // Pick 5 unique names
    const availableNames = [...names];
    for (let i = 0; i < 5; i++) {
      const nameIdx = Math.floor(random(seed++) * availableNames.length);
      const name = availableNames.splice(nameIdx, 1)[0];
      // Generate realistic daily referral count between 5 and 35, sorted descending
      const count = Math.floor(random(seed++) * 30) + 5; 
      leaders.push({ name, count });
    }
    
    return leaders.sort((a, b) => b.count - a.count);
  };

  const [topReferrers, setTopReferrers] = useState<{name: string, count: number}[]>(generateDailyLeaders());
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Fetch admin configs + leaderboard
  useEffect(() => {
    const usersRef = ref(rtdb, 'users');
    const u2 = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const users = Object.values(data) as any[];
        let sorted = users
          .filter(u => u.todayReferrals > 0)
          .sort((a, b) => b.todayReferrals - a.todayReferrals)
          .map(u => ({ name: u.name, count: u.todayReferrals }));
        
        const dailyLeaders = generateDailyLeaders();
        const combined = [...sorted, ...dailyLeaders]
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
          
        setTopReferrers(combined);
      }
    });

    return () => { u2(); };
  }, []);

  // Daily Timer Logic
  useEffect(() => {
    if (!profile?.lastClaimDate) {
      setTimeLeft(0);
      return;
    }
    
    const calculateTimeLeft = () => {
      const nextClaim = addHours(new Date(profile.lastClaimDate!), 24);
      const diff = differenceInSeconds(nextClaim, new Date());
      setTimeLeft(diff > 0 ? diff : 0);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [profile?.lastClaimDate]);

  const handleClaim = async () => {
    if (!profile) return;
    if (timeLeft > 0) {
      showToast('Wait for the timer to finish!');
      return;
    }
    
    audioService.playPop();
    const multiplier = parseInt(profile.activePlan?.replace('VIP ', '') || '1') || 1;
    const gain = 30 * multiplier;
    const newBalance = profile.balance + gain;
    const now = new Date().toISOString();
    
    await update(ref(rtdb, `users/${profile.uid}`), {
      balance: newBalance,
      lastClaimDate: now
    });
    
    showToast(`${profile.activePlan ? 'Demo task completed: +' : 'Claimed Successfully: +'}${gain} BDT!`);
  };

  const copyReferral = () => {
    audioService.playPop();
    const url = `${window.location.origin}?ref=${profile?.uid}`;
    navigator.clipboard.writeText(url);
    showToast('Referral Link Copied!');
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center px-2 py-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border border-white/20"
            style={{ backgroundColor: profile?.avatarColor || '#333' }}
          >
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-slate uppercase tracking-wider">Welcome back</div>
            <div className="text-white font-medium flex items-center gap-1 text-lg">
              {profile?.name} 
              {profile?.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="text-slate hover:text-white transition-colors" onClick={() => showToast('Support Ticket Opened')}>
            <HelpCircle size={22} />
          </button>
          <button className="text-slate hover:text-white transition-colors relative" onClick={() => showToast('No New Notifications')}>
            <Bell size={22} />
            <span className="absolute 0 right-0 w-2 h-2 bg-red-500 rounded-full border border-void"></span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 bg-[#0A0A0A] flex items-center justify-center isolate">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_#FCD53515_0%,_transparent_70%)] pointer-events-none" />
        <div className="flex flex-col items-center justify-center z-10 space-y-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance-coin-bnb-logo.png" alt="Binance" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(252,213,53,0.5)]" />
          <h1 className="text-white text-4xl font-black tracking-tighter drop-shadow-md">BINANCE</h1>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 z-20">
          <h2 className="text-[#FCD535] font-black text-xl tracking-tight drop-shadow-md">Official Partnership</h2>
          <p className="text-white/80 text-xs font-medium tracking-wide uppercase mt-1">Instant Crypto Deposits & Withdrawals</p>
        </div>
      </div>

      {/* Quick Stats & Actions */}
      <div className="glass-panel rounded-[1.5rem] p-5">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex border-r border-white/10 flex-col">
            <span className="text-slate text-xs uppercase mb-1">Total Balance</span>
            <span className="text-gold text-2xl font-bold tracking-tight">৳{profile?.balance.toFixed(2)}</span>
          </div>
          <div className="flex flex-col pl-2">
            <span className="text-slate text-xs uppercase mb-1">Withdrawals</span>
            <span className="text-white text-2xl font-bold tracking-tight">৳{profile?.totalWithdraw.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setVerificationDeposit(false);
              setActiveTab('wallet');
            }}
            className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowDownRight className="w-4 h-4 text-green-400" />
            Deposit
          </button>
          <button 
            onClick={() => {
              setVerificationDeposit(false);
              setActiveTab('wallet');
            }}
            className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-red-400" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Verification Action Block (Only for Unverified) */}
      {!profile?.isVerified ? (
        <div className="glass-panel p-1 rounded-[1.5rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 p-5 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
              <BadgeCheck className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-lg">Action Required</h3>
            <p className="text-slate text-sm">Your account is not verified. Verify now to unlock daily claims, VIP plans, and instant withdrawals.</p>
            <button 
              onClick={() => {
                setActiveTab('wallet');
                setVerificationDeposit(true);
              }}
              className="mt-2 bg-red-600/20 text-red-400 border border-red-500/30 px-6 py-3 rounded-xl font-bold tracking-wide w-full active:scale-95 transition-all"
            >
              VERIFY ACCOUNT NOW (50 BDT)
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={handleClaim}
          disabled={timeLeft > 0}
          className="w-full glass-panel rounded-[1.5rem] p-1 overflow-hidden relative group disabled:opacity-80"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between px-5 py-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium">{profile?.activePlan ? `${profile.activePlan} Demo Tasks` : 'Daily Bonus'}</div>
                <div className="text-slate text-sm">{profile?.activePlan ? `Perform protocol demo tasks (+${30 * (parseInt(profile.activePlan.replace('VIP ', '')) || 1)} BDT)` : 'Claim 30 BDT Everyday'}</div>
              </div>
            </div>
            <div className="text-right">
              {timeLeft > 0 ? (
                <span className="text-gold font-mono font-bold">{formatTimer(timeLeft)}</span>
              ) : (
                <span className="gold-gradient px-4 py-2 rounded-lg text-sm transition-transform active:scale-95 text-black font-bold uppercase">
                  {profile?.activePlan ? 'Execute' : 'Claim Now'}
                </span>
              )}
            </div>
          </div>
        </button>
      )}

      {/* Referral System */}
      <div className="glass-panel rounded-[1.5rem] p-5">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          Your Referral Link
        </h3>
        <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-2 gap-2">
          <input 
            type="text" 
            readOnly 
            value={`${window.location.origin}?ref=${profile?.uid}`} 
            className="bg-transparent flex-1 outline-none text-slate text-sm px-2 truncate"
          />
          <button 
            onClick={copyReferral}
            className="bg-white/10 hover:bg-white/20 p-2 text-white rounded-lg transition-colors active:scale-95"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate text-xs mt-3">Earn 25 BDT for every verified referral instantly.</p>
      </div>

      {/* Leaderboard */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-white font-medium">Top Referrers</h3>
          <span className="text-gold text-xs uppercase tracking-wider">Live Updates</span>
        </div>
        <div className="space-y-3">
          {topReferrers.length === 0 ? (
            <div className="text-slate text-sm text-center py-4 glass-panel rounded-xl border border-white/5">No referrals today</div>
          ) : (
             topReferrers.map((user, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'bg-white/10 text-white'}`}>
                    #{idx + 1}
                  </div>
                  <span className="text-white font-medium">{user.name}</span>
                </div>
                <div className="text-gold font-bold">
                  {user.count} <span className="text-xs text-slate font-normal ml-1">refs</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Partners Footer */}
      <div className="pt-8 pb-4 text-center opacity-50">
        <div className="text-[10px] text-slate uppercase tracking-widest mb-4">Strategic Partners</div>
        <div className="flex justify-center gap-6 items-center flex-wrap">
          <span className="font-bold text-white text-sm">BINANCE</span>
          <span className="font-bold text-white text-sm">BLOCKCHAIN</span>
          <span className="font-bold text-white text-sm">PAYONEER</span>
        </div>
      </div>
    </div>
  );
}
