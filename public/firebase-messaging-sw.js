importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 1. Extract the config from the URL query parameters
const urlParams = new URLSearchParams(location.search);
const configString = urlParams.get('config');

if (configString) {
    const firebaseConfig = JSON.parse(decodeURIComponent(configString));
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // 2. Handle background messages
  // Inside public/firebase-messaging-sw.js

    // 2. Handle background messages
    messaging.onBackgroundMessage(function(payload) {
        console.log('[Service Worker] Received background message ', payload);
        
        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions = {
            body: payload.notification?.body || 'You have a new message on Caskayd.',
            icon: '/icon-192x192.png', 
            data: payload.data 
        };

        // --- NEW: ADD THE RED BADGE TO THE APP ICON ---
        if ('setAppBadge' in navigator) {
            navigator.setAppBadge(); // Calling this without a number adds a simple red dot
        }

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}