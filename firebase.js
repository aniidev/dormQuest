import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyANW_O1aLAQmHdzw-wd9mLHaLhhSWtz8qo',
  authDomain: 'dormquest.firebaseapp.com',
  projectId: 'dormquest',
  storageBucket: 'dormquest.appspot.com',
  messagingSenderId: '410080094214',
  appId: '1:410080094214:web:592b27e463c7b92337fb87',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
