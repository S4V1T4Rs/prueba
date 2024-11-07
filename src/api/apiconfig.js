// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "@firebase/firestore";
import { getAuth } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBLpvQD7OgLbndwF7FCMmpfNZ6oSSyuOQ",
  authDomain: "s4v1t4r-1-n3wk1v.firebaseapp.com",
  projectId: "s4v1t4r-1-n3wk1v",
  storageBucket: "s4v1t4r-1-n3wk1v.appspot.com",
  messagingSenderId: "848292264602",
  appId: "1:848292264602:web:0fe12392b2f41fcf017d23",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
