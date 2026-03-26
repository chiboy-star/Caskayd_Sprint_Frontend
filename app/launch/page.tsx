"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";


const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PWALaunchScreen() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("accessToken");
            
            if (!token) {
                // No token found. Add a slight delay so the splash screen doesn't 
                // just flash aggressively before showing the buttons.
                setTimeout(() => setIsCheckingAuth(false), 1200);
                return;
            }

            try {
                // 1. Try to get role from Token instantly
                const payloadBase64 = token.split('.')[1];
                const payload = JSON.parse(atob(payloadBase64));
                
                if (payload.role === 'business') {
                    return router.replace('/business/discover');
                } else if (payload.role === 'creator') {
                    return router.replace('/creator/discover');
                }

                // 2. FALLBACK: If token exists but role is missing, fetch profile
                console.log("No role found in token, fetching profile as fallback...");
                const res = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const profileData = await res.json();
                    
                    // Logic check: if they have a companyName, they are a business.
                    const isBusiness = Array.isArray(profileData) 
                        ? profileData.some((p: any) => p.companyName) 
                        : !!profileData?.companyName;

                    if (isBusiness) {
                        return router.replace('/business/discover');
                    } else {
                        return router.replace('/creator/discover'); 
                    }
                } else {
                    throw new Error("Failed to fetch profile for fallback");
                }

            } catch (error) {
                console.error("Auth check failed, showing selection screen.", error);
                localStorage.removeItem("accessToken"); // Clear bad/expired token
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className={`min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 ${inter.className} transition-all duration-700`}>
            
            {/* STATE 1: SPLASH SCREEN 
                Shows while checking for a token
            */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${isCheckingAuth ? "opacity-100 z-10" : "opacity-0 pointer-events-none -z-10"}`}>
                {/* Fixed container size and animation. Changed from square to rectangle. */}
                <div className="relative animate-pulse">
                    {/* Container for logo. Wide aspect ratio, emerald background removed for clean look. */}
                    <div className="w-[300px] h-[100px] flex items-center justify-center rounded-[2rem] shadow-2xl shadow-emerald-500/20">
                        <Image 
                            src="/images/Logo_transparent.png" 
                            alt="Caskayd" 
                            width={220} // Display width
                            height={60} // Display height - Next.js will maintain the intrinsic aspect ratio
                            className="object-contain" // Use contain to scale without cropping
                        />
                    </div>
                </div>
            </div>

            {/* STATE 2: ROLE SELECTION
                Fades in if no token is found
            */}
            <div className={`w-full max-w-md px-6 flex flex-col items-center transition-all duration-700 delay-300 transform ${!isCheckingAuth ? "opacity-100 translate-y-0 z-10" : "opacity-0 translate-y-8 pointer-events-none -z-10"}`}>
                
                {/* Changed square container to rectangle. Wide aspect ratio, emerald background removed. */}
                <div className="w-[200px] h-[60px] flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/20 mb-8">
                    <Image 
                        src="/images/Logo_transparent.png" 
                        alt="Caskayd" 
                        width={150} // Smaller size for this screen
                        height={40} // Smaller size, maintaining aspect ratio
                        className="object-contain" // Use contain to scale without cropping
                    />
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Welcome to Caskayd</h1>
                <p className="text-gray-400 text-center mb-10">How would you like to use the app today?</p>

                <div className="w-full flex flex-col gap-4">
                    {/* Brand Route */}
                    <Link 
                        href="/business/login"
                        className="w-full group relative bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl p-6 transition-all cursor-pointer flex items-center justify-between overflow-hidden"
                    >
                        <div className="flex flex-col relative z-10">
                            <span className="text-white font-bold text-lg mb-1">I am a Brand</span>
                            <span className="text-gray-400 text-sm">Hire creators</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white text-gray-400 transition-all z-10 shrink-0">
                            <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Creator Route */}
                    <Link 
                        href="/creator/login"
                        className="w-full group relative bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl p-6 transition-all cursor-pointer flex items-center justify-between overflow-hidden"
                    >
                        <div className="flex flex-col relative z-10">
                            <span className="text-white font-bold text-lg mb-1">I am a Creator</span>
                            <span className="text-gray-400 text-sm">Find deals and monetize your audience</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white text-gray-400 transition-all z-10 shrink-0">
                            <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </Link>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-xs">Don&apos;t have an account? Head to the web version to sign up.</p>
                </div>
            </div>

        </div>
    );
}