/**
 * Configuración de Firebase para SIG Agro
 * Proyecto Firebase: sig-agro-83adc
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración del nuevo proyecto Firebase SIG-agro
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDxuCXZqKOnH_vbFbAwoMCe1JqhjpG7iGg",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sig-agro-83adc.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sig-agro-83adc",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sig-agro-83adc.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "989589425472",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:989589425472:web:bc2605c09c1e6ac8703ea5",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KPRVE2LGZZ"
};

// Inicializar Firebase (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
