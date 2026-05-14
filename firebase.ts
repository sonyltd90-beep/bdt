import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC2AQbfC--8M5LabxlyYiKzT3THbsGgqoo",
  authDomain: "crazyhube-c3fc2.firebaseapp.com",
  databaseURL: "https://crazyhube-c3fc2-default-rtdb.firebaseio.com",
  projectId: "crazyhube-c3fc2",
  storageBucket: "crazyhube-c3fc2.firebasestorage.app",
  messagingSenderId: "1018446653719",
  appId: "1:1018446653719:web:9eeaa42a5bc142a5492f52"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
