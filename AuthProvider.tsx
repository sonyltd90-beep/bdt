import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, query, orderByChild, equalTo, update } from 'firebase/database';
import { auth, rtdb } from '../lib/firebase';
import { useAppStore, UserProfile } from '../store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuthReady, setUser, setProfile } = useAppStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to user profile in RTDB
        const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
        const unsubscribeDb = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.val() as UserProfile);
          } else {
            setProfile(null);
          }
        });

        // Listen for approved verification deposits globally
        const depQuery = query(ref(rtdb, 'admin_requests/deposits'), orderByChild('uid'), equalTo(firebaseUser.uid));
        const unsubscribeDeps = onValue(depQuery, (snap) => {
          let shouldAutoVerify = false;
          snap.forEach(child => {
            const val = child.val();
            if (val.type === 'verification' && val.status === 'approved') {
              shouldAutoVerify = true;
            }
          });
          if (shouldAutoVerify) {
             import('firebase/database').then(({ get }) => {
               get(userRef).then((uSnap) => {
                 if (uSnap.exists() && uSnap.val().isVerified !== true) {
                   update(userRef, { isVerified: true });
                 }
               });
             });
          }
        });

        // Auth is ready only after profile resolves
        setAuthReady(true);
        return () => {
          unsubscribeDb();
          unsubscribeDeps();
        };
      } else {
        setProfile(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, [setAuthReady, setUser, setProfile]);

  return <>{children}</>;
}
