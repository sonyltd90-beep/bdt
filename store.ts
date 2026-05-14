import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export type TabType = 'home' | 'vip' | 'wallet' | 'profile';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  balance: number;
  totalWithdraw: number;
  todayReferrals: number;
  isVerified: boolean;
  referrerUid: string | null;
  lastClaimDate: string | null; // ISO string 
  avatarColor: string;
  activePlan?: string;
}

interface ToastState {
  message: string;
  isVisible: boolean;
}

interface AppState {
  // Auth & User
  authReady: boolean;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  setAuthReady: (ready: boolean) => void;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;

  // Navigation & Lock State
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isVerificationDeposit: boolean;
  setVerificationDeposit: (val: boolean) => void;

  // Toast
  toast: ToastState;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  authReady: false,
  user: null,
  profile: null,
  setAuthReady: (ready) => set({ authReady: ready }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isVerificationDeposit: false,
  setVerificationDeposit: (val) => set({ isVerificationDeposit: val }),

  toast: { message: '', isVisible: false },
  showToast: (message) => {
    set({ toast: { message, isVisible: true } });
    setTimeout(() => {
      set({ toast: { message: '', isVisible: false } });
    }, 3000);
  },
  hideToast: () => set({ toast: { message: '', isVisible: false } }),
}));
