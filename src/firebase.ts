import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWurxet32JE4noxOzMtyS-EttxyWnRmzs",
  authDomain: "receta-bc982.firebaseapp.com",
  projectId: "receta-bc982",
  storageBucket: "receta-bc982.appspot.com",
  messagingSenderId: "1033564259805",
  appId: "1:1033564259805:web:8ada7ff1631064c31c2234"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export firestore instance and helpers
export const db = firebase.firestore();
export const increment = firebase.firestore.FieldValue.increment;