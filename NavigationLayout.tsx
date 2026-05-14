import React, { useState, useRef } from 'react';
import { Home, Crown, Wallet, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, TabType } from '../store';
import { audioService } from '../lib/audio';
import { Dashboard } from '../screens/Dashboard';
import { VipTiers } from '../screens/VipTiers';
import { WalletScreen } from '../screens/Wallet';
import { ProfileScreen } from '../screens/Profile';
import { VerificationModal } from './VerificationModal';

export function NavigationLayout() {
  const { profile, activeTab, setActiveTab, setVerificationDeposit } = useAppStore();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 60) {
      setIsNavVisible(false); // scrolling down
    } else {
      setIsNavVisible(true); // scrolling up
    }
    setLastScrollY(currentScrollY);
  };

  const handleTabChange = (tab: TabType) => {
    if (activeTab !== tab) {
      audioService.playPop();
      if (tab === 'wallet') {
        setVerificationDeposit(false);
      }
      setActiveTab(tab);
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'vip', icon: Crown, label: 'VIP' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'profile', icon: UserIcon, label: 'Profile' },
  ] as const;

  const isRestricted = (tab: TabType) => {
    // We handle VIP restrictions inside VipTiers.tsx now
    return false;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-void overflow-hidden">
      {/* Main Content Area */}
      <main 
        onScroll={handleScroll}
        className="flex-1 overflow-x-hidden overflow-y-auto pb-20 no-scrollbar relative"
      >
        <AnimatePresence mode="wait" custom={activeTab}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full origin-top"
          >
            {activeTab === 'home' && <Dashboard />}
            {activeTab === 'vip' && <VipTiers />}
            {activeTab === 'wallet' && <WalletScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
        
        {/* Verification Gateway Overlay */}
        <AnimatePresence>
          {isRestricted(activeTab) && (
            <div className="absolute inset-0 z-30">
              <VerificationModal />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: isNavVisible ? 0 : 100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-0 w-full glass-panel border-t border-white/10 rounded-t-3xl pb-safe pt-2 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40"
      >
        <ul className="flex justify-between items-center py-2 relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id} className="relative z-10 w-16 flex flex-col items-center">
                <button
                  onClick={() => handleTabChange(item.id)}
                  className="flex flex-col items-center w-full focus:outline-none"
                >
                  <motion.div
                    animate={{ 
                      y: isActive ? -4 : 0, 
                      scale: isActive ? 1.1 : 1 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon size={24} className={`mb-1 transition-colors ${isActive ? 'text-gold' : 'text-slate'}`} />
                  </motion.div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-slate'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-3 w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#FFD700]"
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
}
