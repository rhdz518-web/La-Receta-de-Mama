// @ts-nocheck

// NOTE: Replace these placeholder values with your own Firebase project configuration.
// Go to your Firebase project console:
// 1. Click the gear icon -> Project settings.
// 2. In the "General" tab, scroll down to "Your apps".
// 3. If you haven't created a web app, add one.
// 4. Find your web app and click on the "SDK setup and configuration" section, select "Config".
// 5. Copy the 'firebaseConfig' object and paste it here.
const firebaseConfig = {
  apiKey: "AIzaSy...YOUR-API-KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
// The firebase object is available globally from the scripts in index.html
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}

export const db = window.firebase.firestore();
export const increment = window.firebase.firestore.FieldValue.increment;
