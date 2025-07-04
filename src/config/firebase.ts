import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDx8JC-U2-zw9qTXfO2V3uLR1FjyRDCGo",
  authDomain: "artho-hiseb.firebaseapp.com",
  projectId: "artho-hiseb",
  databaseURL: "https://artho-hiseb-default-rtdb.firebaseio.com/",
  storageBucket: "artho-hiseb.firebasestorage.app",
  messagingSenderId: "381279423963",
  appId: "1:381279423963:web:f52c7f6f8045b90ccb6bfe"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
