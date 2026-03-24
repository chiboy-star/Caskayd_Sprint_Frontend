"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon } from "@heroicons/react/24/outline";

export default function InstallBanner() {
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true); // Assume installed until proven otherwise to prevent flashing
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // 1. Check if user already dismissed this session/forever
        if (localStorage.getItem("caskayd_install_dismissed") === "true") {
            setIsDismissed(true);
        }

        // 2. Check if already installed (standalone mode)
        const isAppMode = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
        setIsStandalone(isAppMode);

        // 3. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isAppleDevice);

        // 4. Listen for Android/Desktop install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // Prevent the tiny default browser infobar
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native prompt
        deferredPrompt.prompt();

        // Wait for user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        
        // Clear the prompt either way so it can't be used again
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem("caskayd_install_dismissed", "true");
    };

    // Don't show if installed, dismissed, or not ready/supported
    if (isStandalone || isDismissed) return null;
    if (!isInstallable && !isIOS) return null;

    return (
        <div className="fixed bottom-0 sm:bottom-6 sm:right-6 left-0 sm:left-auto w-full sm:w-96 bg-slate-900 text-white p-4 sm:rounded-2xl shadow-2xl z-[150] flex flex-col gap-3 animate-in slide-in-from-bottom-10">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <ArrowDownTrayIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Install Caskayd</h3>
                    <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                        {isIOS 
                            ? "To install, tap the Share icon at the bottom of Safari and select 'Add to Home Screen'." 
                            : "Get the free app for a faster, better experience."}
                    </p>
                </div>
            </div>

            {/* Only show the button if the device supports automated installation */}
            {!isIOS && isInstallable && (
                <button 
                    onClick={handleInstallClick}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm mt-1 cursor-pointer"
                >
                    Install App Now
                </button>
            )}
        </div>
    );
}