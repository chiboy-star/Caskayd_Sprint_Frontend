"use client";

import Image from "next/image";
import { ChatBubbleOvalLeftIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

export default function NavigationPill() {
    return (
        // Sticky container with blur effect
        // bg-white/70 + backdrop-blur-md creates the "frosted glass" look over scrolling content
        <div className="sticky top-0 z-50 w-full px-4 md:px-8 py-4 bg-white/70 backdrop-blur-md transition-all">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-full shadow-lg shadow-gray-200/50 border border-gray-100 py-2.5 px-4 md:px-6 flex items-center justify-between">
                    
                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative w-8 h-8 shrink-0">
                            <Image 
                                src="/images/Logo_transparent_icon.png" 
                                alt="Caskayd" 
                                fill
                                className="object-contain"
                            />
                        </div>
                        {/* Hidden on small mobile, visible on larger screens */}
                        <span className="font-extrabold text-xl tracking-tight hidden sm:block text-slate-900">
                            Caskayd
                        </span>
                    </div>

                    {/* Center: Navigation Pills */}
                    {/* On mobile: Icons only. On Desktop: Icons + Text */}
                    <div className="flex items-center gap-6 md:gap-8 absolute left-1/2 -translate-x-1/2">
                        <div className="flex flex-col items-center gap-1 cursor-pointer text-emerald-600 group">
                            <div className="flex items-center gap-2 font-bold p-2 md:p-0">
                                <GlobeAltIcon className="w-6 h-6 md:w-5 md:h-5" />
                                <span className="hidden md:block">Discover</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-900 transition-colors cursor-pointer pb-2.5 group">
                            <div className="p-2 md:p-0">
                                <ChatBubbleOvalLeftIcon className="w-6 h-6 md:w-5 md:h-5 group-hover:text-gray-900" />
                            </div>
                            <span className="hidden md:block">Messages</span>
                        </div>
                    </div>

                    {/* Right: Profile */}
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs md:text-sm cursor-pointer hover:bg-gray-800 transition-colors shadow-md shrink-0">
                        Hp
                    </div>
                </div>
            </div>
        </div>
    );
}