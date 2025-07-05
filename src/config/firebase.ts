import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmgZXjhdbiskXoo8_aTqp0-ZPnvW5JYnM",
  authDomain: "orther-hiseb.firebaseapp.com",
  databaseURL: "https://orther-hiseb-default-rtdb.firebaseio.com/",
  projectId: "orther-hiseb",
  storageBucket: "orther-hiseb.firebasestorage.app",
  messagingSenderId: "362762429254",
  appId: "1:362762429254:web:a2609bf371784257597b47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);



export default app;
