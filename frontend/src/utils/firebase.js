import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDIU7mo7PNkC4rIVoQ4nr48VX3HM8B26w",
  authDomain: "better-me-faas.firebaseapp.com",
  projectId: "better-me-faas",
  storageBucket: "better-me-faas.firebasestorage.app",
  messagingSenderId: "802342479344",
  appId: "1:802342479344:web:34bbc889f762413b466935"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
