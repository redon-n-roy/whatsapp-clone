import firebase from "firebase";

const firebaseConfig = {
    apiKey: "AIzaSyARyPhEs-bWBkaR9X-h_aTosGQk7j9dkqg",
    authDomain: "whatsapp-clone-cd555.firebaseapp.com",
    databaseURL: "https://whatsapp-clone-cd555.firebaseio.com",
    projectId: "whatsapp-clone-cd555",
    storageBucket: "whatsapp-clone-cd555.appspot.com",
    messagingSenderId: "481843079370",
    appId: "1:481843079370:web:6ed6826036e5232266ac33"
  };

  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const db = firebaseApp.firestore();
  const storage = firebaseApp.storage();
  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  export {auth, provider, storage};
  export default db;