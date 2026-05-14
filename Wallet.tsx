import React, { useState, useEffect } from 'react';
import { Copy, ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, ShieldCheck, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ref, onValue, push, query, orderByChild, equalTo } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { useAppStore } from '../store';
import { audioService } from '../lib/audio';
import { motion, AnimatePresence } from 'motion/react';

export function WalletScreen() {
  const { profile, showToast, isVerificationDeposit, setVerificationDeposit } = useAppStore();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [paymentNumbers, setPaymentNumbers] = useState({ bkash: '', nagad: '', binance: '', payoneer: '' });
  const [history, setHistory] = useState<any[]>([]);

  // Form State
  const [amount, setAmount] = useState(isVerificationDeposit ? '50' : '');
  const [trxId, setTrxId] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'binance' | 'payoneer'>('bkash');

  useEffect(() => {
    if (!profile?.uid) return;
    const depQuery = query(ref(rtdb, 'admin_requests/deposits'), orderByChild('uid'), equalTo(profile.uid));
    const withQuery = query(ref(rtdb, 'admin_requests/withdrawals'), orderByChild('uid'), equalTo(profile.uid));

    const unsubDep = onValue(depQuery, (snap) => {
      const deps: any[] = [];
      
      snap.forEach(child => {
        const val = child.val();
        deps.push({ id: child.key, _category: 'deposit', ...val });
      });
      
      setHistory(prev => {
        const others = prev.filter(p => p._category !== 'deposit');
        return [...others, ...deps].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    });

    const unsubWith = onValue(withQuery, (snap) => {
      const withs: any[] = [];
      snap.forEach(child => { withs.push({ id: child.key, _category: 'withdrawal', ...child.val() }); });
      setHistory(prev => {
        const others = prev.filter(p => p._category !== 'withdrawal');
        return [...others, ...withs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    });

    return () => { unsubDep(); unsubWith(); };
  }, [profile?.uid]);

  useEffect(() => {
    const pRef = ref(rtdb, 'admin_config/payment_numbers');
    const unsub = onValue(pRef, (snap) => {
      if (snap.exists()) setPaymentNumbers(snap.val());
      else setPaymentNumbers({ bkash: '01700000000', nagad: '01900000000', binance: '202316886', payoneer: 'pay@crazyhube.com' });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isVerificationDeposit) setAmount('50');
    else setAmount('');
  }, [isVerificationDeposit]);

  const handleCopyNumber = (num: string) => {
    audioService.playPop();
    navigator.clipboard.writeText(num);
    showToast('Payment Address Copied!');
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = isVerificationDeposit ? '50' : amount;
    if (!finalAmount || !trxId) return;

    const reqRef = ref(rtdb, 'admin_requests/deposits');
    const newReqRef = await push(reqRef, {
      uid: profile?.uid,
      name: profile?.name,
      amount: parseFloat(finalAmount),
      method,
      trxId,
      type: isVerificationDeposit ? 'verification' : 'deposit',
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    if (isVerificationDeposit) {
      showToast('Verification request sent for review. You will be verified once approved.');
      setVerificationDeposit(false);
    } else {
      showToast('Deposit submitted.');
    }
    
    setAmount('');
    setTrxId('');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !destinationAccount) return;
    if (parseFloat(amount) > (profile?.balance || 0)) {
      showToast('Insufficient Balance!');
      return;
    }

    const reqRef = ref(rtdb, 'admin_requests/withdrawals');
    await push(reqRef, {
      uid: profile?.uid,
      name: profile?.name,
      amount: parseFloat(amount),
      method,
      destination: destinationAccount,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    showToast('Withdrawal request initialized.');
    setAmount('');
    setDestinationAccount('');
  };

  const methods = [
    { id: 'bkash', name: 'bKash', color: '#E2136E', logo: 'https://www.vectorlogo.zone/logos/bkash/bkash-icon.svg', filter: '' },
    { id: 'nagad', name: 'Nagad', color: '#F7931E', logo: 'https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png', filter: '' },
    { id: 'binance', name: 'Binance', color: '#FCD535', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance-coin-bnb-logo.png', filter: '' },
    { id: 'payoneer', name: 'Payoneer', color: '#FF4800', logo: 'https://www.vectorlogo.zone/logos/payoneer/payoneer-icon.svg', filter: '' },
  ] as const;

  return (
    <div className="p-4 space-y-6 pt-8 pb-32 min-h-screen">
      {/* Wallet Balance Card - Ultra Premium */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2rem] p-8 overflow-hidden isolate"
      >
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2rem] z-[-1] backdrop-blur-2xl" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/20 blur-[80px] rounded-full z-[-1]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full z-[-1]" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <span className="text-slate uppercase tracking-widest text-[10px] font-bold">Total Portfolio Value</span>
          </div>
          <span className="bg-white/10 text-white text-[10px] uppercase px-3 py-1 rounded-full font-bold tracking-wider backdrop-blur-md">
            {profile?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          </span>
        </div>
        
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight mb-2 flex items-center">
          <span className="text-gold font-normal text-3xl mr-1">৳</span>
          {profile?.balance.toFixed(2)}
        </h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-[#0A0A0A] p-1 rounded-2xl shadow-inner relative z-10 border border-white/5">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'deposit' 
              ? 'bg-gradient-to-r from-white/10 to-white/5 text-white shadow-lg' 
              : 'text-slate hover:text-white/80'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" /> Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'withdraw' 
              ? 'bg-gradient-to-r from-white/10 to-white/5 text-white shadow-lg' 
              : 'text-slate hover:text-white/80'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-gradient-to-r from-white/10 to-white/5 text-white shadow-lg' 
              : 'text-slate hover:text-white/80'
          }`}
        >
          <Clock className="w-4 h-4" /> History
        </button>
      </div>

      {/* Forms Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'deposit' && (
            <motion.div 
              key="deposit"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Network Selection */}
              <div className="space-y-3">
                <h3 className="text-slate text-[10px] uppercase font-bold tracking-widest pl-2">Select Network</h3>
                <div className="grid grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as any)}
                      className={`relative p-4 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-2 ${
                        method === m.id 
                          ? `bg-[${m.color}]/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]` 
                          : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                      style={method === m.id ? { borderColor: m.color, backgroundColor: `${m.color}15` } : {}}
                    >
                      {method === m.id && (
                        <motion.div 
                          layoutId="method-highlight-dep"
                          className="absolute inset-0 z-0 opacity-20"
                          style={{ background: `radial-gradient(circle at center, ${m.color}, transparent 70%)` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      )}
                      <img src={m.logo} alt={m.name} className="h-6 object-contain relative z-10" style={{ filter: m.filter }} />
                      <span className="text-white text-xs font-bold relative z-10">{m.name}</span>
                      {method === m.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-2 h-2 rounded-full relative z-10" 
                          style={{ backgroundColor: m.color }} 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit Address Card */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-[1.5rem] p-5 relative overflow-hidden h-[180px] shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, x: 20, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="h-full flex flex-col"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      {methods.find(m => m.id === method) && (
                        <img src={methods.find(m => m.id === method)?.logo} className="h-32 object-contain grayscale" style={{ filter: methods.find(m => m.id === method)?.filter }} />
                      )}
                    </div>
                    <h3 className="text-slate text-[10px] uppercase font-bold tracking-widest mb-4">Official Deposit Address</h3>
                    <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5 relative overflow-hidden backdrop-blur-md">
                      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: methods.find(m => m.id === method)?.color }} />
                      <span className="text-white font-mono text-sm sm:text-base font-bold tracking-wider relative z-10 drop-shadow-md">
                        {paymentNumbers[method as keyof typeof paymentNumbers] || 'Loading...'}
                      </span>
                      <button 
                        onClick={() => handleCopyNumber(paymentNumbers[method as keyof typeof paymentNumbers])}
                        className="bg-white text-black p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate/60 text-[10px] mt-4 leading-relaxed font-medium">
                      Send only <span style={{ color: methods.find(m => m.id === method)?.color }} className="font-bold">{methods.find(m => m.id === method)?.name}</span> to this address. Sending any other network assets will result in permanent loss.
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Form Input */}
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 relative">
                  <label className="text-slate text-[10px] uppercase font-bold tracking-widest absolute top-3 left-4">
                    {isVerificationDeposit ? 'Verification Amount' : 'Deposit Amount (BDT)'}
                  </label>
                  <input 
                    type="number" 
                    required min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full bg-transparent px-4 pt-8 pb-3 text-white text-xl font-mono focus:outline-none placeholder:text-slate/30 ${isVerificationDeposit ? 'text-gold' : ''}`}
                    placeholder="0.00"
                  />
                  {isVerificationDeposit && <Lock className="absolute top-10 right-4 w-5 h-5 text-gold/50" />}
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 relative">
                  <label className="text-slate text-[10px] uppercase font-bold tracking-widest absolute top-3 left-4">Transaction hash / TrxID</label>
                  <input 
                    type="text" 
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full bg-transparent px-4 pt-8 pb-3 text-white font-mono focus:outline-none placeholder:text-slate/30 uppercase"
                    placeholder="e.g. 7A9B3XYZ"
                  />
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-5 rounded-2xl font-black tracking-widest text-shadow transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2
                    ${isVerificationDeposit 
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]' 
                      : 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                    }`}
                >
                  {isVerificationDeposit ? 'COMPLETE VERIFICATION' : 'CONFIRM DEPOSIT'} <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'withdraw' && (
            <motion.div 
              key="withdraw"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {!profile?.isVerified && (
                <div className="absolute inset-0 z-20 bg-void/95 backdrop-blur-xl flex flex-col items-center justify-center rounded-[2rem] border border-white/5 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[60px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 blur-[60px] rounded-full pointer-events-none" />
                  
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#0A0A0A] to-red-950/30 flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_40px_rgba(220,38,38,0.2)] rotate-3">
                    <Lock className="w-10 h-10 text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
                  </div>
                  
                  <h3 className="text-white font-black text-3xl mb-3 tracking-tighter uppercase relative z-10">Vault Locked</h3>
                  <p className="text-slate/80 text-sm mb-10 max-w-[260px] leading-relaxed font-medium relative z-10">
                    Identity verification is strictly required to protect your assets and enable high-tier withdrawals.
                  </p>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('deposit');
                      setVerificationDeposit(true);
                    }}
                    className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-5 rounded-2xl font-black tracking-[0.2em] shadow-[0_0_30px_rgba(255,215,0,0.3)] active:scale-95 transition-all text-xs flex justify-center items-center gap-2 relative z-10 hover:shadow-[0_0_50px_rgba(255,215,0,0.5)]"
                  >
                    VERIFY IDENTITY NOW <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}

              {/* Network Selection */}
              <div className="space-y-3">
                <h3 className="text-slate text-[10px] uppercase font-bold tracking-widest pl-2">Withdrawal Network</h3>
                <div className="grid grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as any)}
                      className={`relative p-4 rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center gap-2 ${
                        method === m.id 
                          ? `bg-[${m.color}]/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]` 
                          : 'bg-[#0A0A0A] border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                      style={method === m.id ? { borderColor: m.color, backgroundColor: `${m.color}15` } : {}}
                    >
                      {method === m.id && (
                        <motion.div 
                          layoutId="method-highlight-with"
                          className="absolute inset-0 z-0 opacity-20"
                          style={{ background: `radial-gradient(circle at center, ${m.color}, transparent 70%)` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        />
                      )}
                      <img src={m.logo} alt={m.name} className="h-6 object-contain relative z-10" style={{ filter: m.filter }} />
                      <span className="text-white text-xs font-bold relative z-10">{m.name}</span>
                      {method === m.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-2 h-2 rounded-full relative z-10" 
                          style={{ backgroundColor: m.color }} 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 relative focus-within:border-white/30 transition-colors">
                  <label className="text-slate text-[10px] uppercase font-bold tracking-widest absolute top-3 left-4">Destination Address / Number</label>
                  <input 
                    type="text"
                    required
                    value={destinationAccount}
                    onChange={(e) => setDestinationAccount(e.target.value)}
                    className="w-full bg-transparent px-4 pt-8 pb-3 text-white font-mono focus:outline-none placeholder:text-slate/30"
                    placeholder="Enter recipient..."
                  />
                </div>
                
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 relative focus-within:border-white/30 transition-colors">
                  <div className="flex justify-between items-center absolute top-3 left-4 right-4">
                    <label className="text-slate text-[10px] uppercase font-bold tracking-widest">Withdraw Amount</label>
                    <span className="text-gold text-[10px] font-mono">Bal: ৳{profile?.balance.toFixed(2)} | Max: ৳10000</span>
                  </div>
                  <input 
                    type="number"
                    required min="100" max="10000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent px-4 pt-8 pb-3 text-white text-xl font-mono focus:outline-none placeholder:text-slate/30"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 flex justify-between items-center mb-6">
                  <span className="text-slate text-xs">Network Fee</span>
                  <span className="text-white font-mono text-sm">0.00 BDT</span>
                </div>

                <button 
                  type="submit" 
                  disabled={!profile?.isVerified}
                  className="w-full py-5 rounded-2xl font-black tracking-widest bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 flex justify-center items-center gap-2"
                >
                  CONFIRM WITHDRAWAL <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#0A0A0A] rounded-[2rem] border border-white/5">
                  <Clock className="w-12 h-12 text-slate/30 mb-4" />
                  <p className="text-slate/50 text-sm font-medium tracking-wide">No transactions found</p>
                </div>
              ) : (
                history.map((tx: any) => (
                  <div key={tx.id} className="bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                        tx._category === 'deposit' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20 group-hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500/20'
                        }`}
                      >
                        {tx._category === 'deposit' ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm tracking-wide">{tx._category === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
                          <span className="bg-white/5 text-slate px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">{tx.method}</span>
                        </div>
                        <p className="text-slate/50 text-xs mt-1.5 font-medium">{new Date(tx.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-base font-black tracking-tighter ${tx._category === 'deposit' ? 'text-green-500' : 'text-white'}`}>
                        {tx._category === 'deposit' ? '+' : '-'}৳{tx.amount.toFixed(2)}
                      </p>
                      <div className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider flex items-center justify-end gap-1 ${
                        tx.status === 'approved' ? 'text-green-500' : 
                        tx.status === 'rejected' ? 'text-red-500' : 
                        'text-gold'
                      }`}>
                        {tx.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : 
                         tx.status === 'rejected' ? <XCircle className="w-3 h-3" /> : 
                         <Clock className="w-3 h-3 animate-spin-slow" />}
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
