import { ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';

export function VerificationModal() {
  const { setActiveTab, setVerificationDeposit } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-void/90 backdrop-blur-3xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-panel w-full max-w-sm rounded-[2rem] p-8 border-gold/20 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-gold" />
        </div>

        <h2 className="text-xl font-bold text-white mb-3">Account Inactive</h2>
        
        <p className="text-slate text-sm leading-relaxed mb-8">
          To unlock high-yield earning functions, VIP tiers, and real-time withdrawals, please verify your profile for a one-time fee of <strong className="text-gold">50 BDT</strong>.
        </p>

        <button 
          className="w-full py-4 rounded-xl gold-gradient font-bold tracking-wide shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-transform active:scale-95"
          onClick={() => {
            setActiveTab('wallet');
            setVerificationDeposit(true);
          }}
        >
          VERIFY ACCOUNT (50 BDT)
        </button>
      </motion.div>
    </motion.div>
  );
}
