// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtIjTsi7VKZUK88ykR7lNIro-zSdpcZkI",
  authDomain: "shvanjamal-eb0b1.firebaseapp.com",
  projectId: "shvanjamal-eb0b1",
  storageBucket: "shvanjamal-eb0b1.firebasestorage.app",
  messagingSenderId: "608015551248",
  appId: "1:608015551248:web:b8502fc6e441e1acfaf395",
  measurementId: "G-W0GNNPFE6T"
};

// Initialize Firebase
let firebaseApp = null;
if (typeof firebase !== 'undefined') {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

