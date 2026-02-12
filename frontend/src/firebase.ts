import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDqADUe0pPMJOTgheBxwoMr4064sqtVOoE",
  authDomain: "ai-grievance-redressal-system.firebaseapp.com",
  projectId: "ai-grievance-redressal-system",
  storageBucket: "ai-grievance-redressal-system.firebasestorage.app",
  messagingSenderId: "45309696772",
  appId: "1:45309696772:web:e3f6274d9069c34a3ece51"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
