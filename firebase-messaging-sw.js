/* Service worker Firebase Cloud Messaging pour PROLIFIC.
   Reçoit les notifications push quand l'app est en arrière-plan ou fermée.
   Doit rester à la racine du site (même config Firebase que index.html). */

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBJqLfZgSJ1qUsfCCt82TTLA5jY-jYY1Qw",
  authDomain: "prolific-89772.firebaseapp.com",
  databaseURL: "https://prolific-89772-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "prolific-89772",
  storageBucket: "prolific-89772.firebasestorage.app",
  messagingSenderId: "174305254232",
  appId: "1:174305254232:web:6799d8cd1661cedbf9a32d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'PROLIFIC';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body,
    icon: 'icon-192.png',
  });
});
