"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingNavigationPill() {
    return (
        // z-50 ensures it stays on top. Fixed positioning to keep it pinned.
        <div className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center py-4 md:py-6 pointer-events-none px-4">
            {/* Inner container with pointer-events-auto so buttons are clickable */}
            {/* Adjusted min-width, padding, and gaps for responsiveness */}
            <div className="pointer-events-auto bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-purple-900/5 border border-white/60 py-2.5 px-5 md:px-8 flex items-center justify-between gap-4 md:gap-12 w-full max-w-sm md:max-w-2xl transition-all hover:shadow-xl hover:shadow-purple-900/10">
                
                 {/* Left: Logo */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-8 h-8">
                        <Image 
                            src="/images/Logo_transparent_icon.png" 
                            alt="Caskayd" 
                            fill
                            className="object-contain"
                        />
                    </div>
                    {/* Hide Brand Name on small mobile screens to save space */}
                    <span className=" font-extrabold text-xl tracking-tight text-slate-900">
                        Caskayd
                    </span>
                </div>

                {/* Right: Auth Links */}
                <div className="flex items-center gap-3 md:gap-6 text-sm font-bold">
                    <Link 
                        href="/business/login" 
                        className="text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
                    >
                        {/* Mobile Text */}
                        <span className="md:hidden">Business</span>
                        {/* Desktop Text */}
                        <span className="hidden md:inline">Login as Business</span>
                    </Link>
                    
                    {/* Vertical Divider */}
                    <div className="h-4 w-[1px] bg-gray-300 block"></div>

                    <Link 
                        href="/creator/login" 
                        className="text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap"
                    >
                        {/* Mobile Text */}
                        <span className="md:hidden">Creator</span>
                        {/* Desktop Text */}
                        <span className="hidden md:inline">Login as Creator</span>
                    </Link>
                </div>

            </div>
        </div>
    );
} 