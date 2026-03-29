/*This is our Firebase Configuration Folder.
 It initializes the connection to our cloud services using Environment Variables for security.
  It exports the auth and database objects, 
  which act as the central 'Control Panel' for every other part of the app 
  that needs to log in users or save patient records*/


import { initializeApp } from 'firebase/app';//Initializes the connection
import { getAuth } from 'firebase/auth';//Brings in the "Security Guard"
import { getDatabase } from 'firebase/database';//Brings in the "Database Manager"

const firebaseConfig = {//contains all the unique IDs that identify your specific project in the Google Cloud.
    //Instead of typing the secret keys directly here (which is dangerous), we store them in a hidden file called .env.
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);//This is like plugging your app into the Google Wi-Fi.
export const auth = getAuth(app);//This is the "Security Guard"
export const database = getDatabase(app);//This is the "Database Manager"
