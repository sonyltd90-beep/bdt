import { useEffect } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { useAppStore } from './store';
import { NavigationLayout } from './components/NavigationLayout';
import { AuthPortal } from './screens/Auth';
import { Toast } from './components/Toast';
import { audioService } from './lib/audio';

function Root() {
  const { authReady, user } = useAppStore();

  if (!authReady) {
    return (
      <div className="h-screen bg-void flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
      </div>
    );
  }

  return (
    <>
      {user ? (
        <NavigationLayout />
      ) : (
        <AuthPortal />
      )}
    </>
  );
}

export default function App() {
  useEffect(() => {
    const unlockAudio = () => {
      audioService.playPop(); // Unlock on first click
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  return (
    <AuthProvider>
      <Root />
      <Toast />
    </AuthProvider>
  );
}
