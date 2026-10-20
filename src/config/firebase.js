// Firebase Configuration
// TODO: Replace these values with your actual Firebase project config
// Go to: https://console.firebase.google.com → Your Project → Project Settings → Web App

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            "AIzaSyDRlLkzqWhPGzaVUS-_a_I47reCgiO7YnA",
  authDomain:        "home-decore-ai-4543f.firebaseapp.com",
  projectId:         "home-decore-ai-4543f",
  storageBucket:     "home-decore-ai-4543f.firebasestorage.app",
  messagingSenderId: "463435091470",
  appId:             "1:463435091470:web:637b9d9f0643ce4bf4b65f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Web uses getAuth(), Native uses initializeAuth with AsyncStorage persistence
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export default app;
