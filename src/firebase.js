import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Cambiamos esto

const firebaseConfig = {
  apiKey: "AIzaSyCyvwbjWl1CX9cHu1jKFnvW-7KvJg2A4-A",
  authDomain: "dosesync2026.firebaseapp.com",
  projectId: "dosesync2026",
  storageBucket: "dosesync2026.firebasestorage.app",
  messagingSenderId: "816346985499",
  appId: "1:816346985499:web:708b2522469ae9130734be",
  databaseURL: "https://dosesync2026-default-rtdb.firebaseio.com" // Añade esta línea
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // Ahora db apunta a Realtime Database