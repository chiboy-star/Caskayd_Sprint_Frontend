"use client";

import { useEffect, useState } from "react";
// We will create this firebase.ts file once we get the config from your dev!
import { messaging, getToken, onMessage } from "@/lib/firebase"; 

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const usePushNotifications = (onForegroundMessage?: (payload: any) => void) => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const setupNotifications = async () => {
            try {
                // Wait for the messaging module to initialize
                const m = await messaging();
                if (!m) {
                    return; 
                }

                // Request permission from the user (the native browser popup)
                const permission = await Notification.requestPermission();
                
                if (permission === "granted") {
                    
                    // 1. Package your .env variables safely
                    const firebaseConfig = {
                        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                    };
                    
                    // Encode the config into a URL-safe string
                    const encodedConfig = encodeURIComponent(JSON.stringify(firebaseConfig));

                    // 2. Manually register the service worker, passing the config in the URL
                    const registration = await navigator.serviceWorker.register(
                        `/firebase-messaging-sw.js?config=${encodedConfig}`
                    );

                    // Wait for the service worker to be fully ready
                    await navigator.serviceWorker.ready;

                    // 3. Generate the unique token using your VAPID key AND the custom registration
                    const currentToken = await getToken(m, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                        serviceWorkerRegistration: registration,
                    });

                    if (currentToken) {
                        setToken(currentToken);
                        
                        // Grab the auth token to securely send the FCM token to your backend
                        const authToken = localStorage.getItem("accessToken");
                        
                        if (authToken) {
                            fetch(`${BASE_URL}/users/fcm-token`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${authToken}`
                                },
                                body: JSON.stringify({ token: currentToken })
                            })
                            .then(async (res) => {
                                // FIX: Handle empty responses from the backend safely
                                const text = await res.text();
                                const data = text ? JSON.parse(text) : { status: "success (empty body)" };
                            })
                            .catch(err => console.error("🔴 [API Error] Failed to save FCM token", err));
                        }
                    }
                } else {
                }
            } catch (error) {
            }
        };

        setupNotifications();
    }, []);

    // Set up the listener for when the app is actively open on the screen
    useEffect(() => {
        const setupForegroundListener = async () => {
            const m = await messaging();
            if (m && onForegroundMessage) {
                const unsubscribe = onMessage(m, (payload) => {
                    onForegroundMessage(payload);
                });
                // Clean up the listener when the component unmounts
                return () => unsubscribe();
            }
        };

        setupForegroundListener();
    }, [onForegroundMessage]);

    return { token };
};