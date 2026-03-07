"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname ,useRouter} from "next/navigation";
import { 
    ChatBubbleOvalLeftIcon, 
    WalletIcon, 
    Squares2X2Icon, 
    XMarkIcon, 
    ArrowRightOnRectangleIcon,
    BellIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AppNotification {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
}

export default function CreatorNavigationPill() {
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // --- USER PROFILE STATE ---
    // Flow: Holds the data fetched from GET /users/profiles
    const [userProfile, setUserProfile] = useState<{ email?: string; avatar?: string; displayName?: string; companyName?: string } | null>(null);

    // --- NOTIFICATIONS & MESSAGES ---
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const isActive = (path: string) => pathname?.includes(path);
    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        router.push("/creator/login");
    };

    // --- FETCH LOGIC ---
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        // Flow: Fetch static user profile data ONCE when the component mounts
        const fetchUserProfile = async () => {
            try {
                console.log("🔵 [Creator API Request] GET /users/profiles");
                const profileRes = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    console.log("🟢 [Creator API Response] GET /users/profiles SUCCESS:", profileData);
                    
                    // Flow: Handle both Array and Object responses. Prioritize the object with 'displayName' for creators.
                    if (Array.isArray(profileData) && profileData.length > 0) {
                        const activeCreatorProfile = profileData.find((p: any) => p.displayName) || profileData[0];
                        setUserProfile(activeCreatorProfile);
                    } else if (profileData && typeof profileData === 'object') {
                        setUserProfile(profileData);
                    }
                } else {
                    console.error("🔴 [Creator API Error] GET /users/profiles FAILED:", await profileRes.text());
                }
            } catch (error) {
                console.error("🔴 [Creator Network Error] GET /users/profiles crashed:", error);
            }
        };

        const fetchAlerts = async () => {
            // 1. Fetch Unread Messages Count
            try {
                const msgRes = await fetch(`${BASE_URL}/messages/unread/count`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (msgRes.ok) {
                    const msgCount = await msgRes.text(); 
                    setUnreadMessages(Number(msgCount) || 0);
                } 
            } catch (error) {
                console.error("🔴 [Network Error] GET /messages/unread/count crashed:", error);
            }

            // 2. Fetch Notifications
            try {
                const notifRes = await fetch(`${BASE_URL}/notifications`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    setNotifications(notifData);
                } 
            } catch (error) {
                console.error("🔴 [Network Error] GET /notifications crashed:", error);
            }
        };

        fetchUserProfile(); // Run once
        fetchAlerts();      // Run immediately
        const interval = setInterval(fetchAlerts, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    // --- MARK NOTIFICATION AS READ ---
    const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return; 

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

        try {
            console.log(`🔵 [API Request] PATCH /notifications/${id}/read`);
            const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log(`🟢 [API Response] PATCH /notifications/${id}/read SUCCESS`);
            } else {
                console.error(`🔴 [API Error] PATCH /notifications/${id}/read FAILED:`, await res.text());
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            }
        } catch (error) {
            console.error(`🔴 [Network Error] PATCH /notifications/${id}/read crashed:`, error);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
        }
    };
    
    // --- DYNAMIC UI HELPERS & FALLBACKS ---
    const dispName = userProfile?.displayName || userProfile?.companyName || "Creator";
    const userEmail = userProfile?.email || "creator@example.com";
    const initial = dispName.charAt(0).toUpperCase();

    return (
        <>
            {/* --- NAVIGATION PILL --- */}
            <div className="fixed top-0 left-0 right-0 z-40 w-full px-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-gray-50 transition-all">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-full shadow-lg shadow-gray-200/50 border border-gray-100 py-2.5 px-4 md:px-6 flex items-center justify-between relative">
                        
                        {/* Left: Logo */}
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <div className="relative w-8 h-8 shrink-0">
                                <Image 
                                    src="/images/Logo_transparent_icon.png" 
                                    alt="Caskayd" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight hidden sm:block text-slate-900">
                                Caskayd
                            </span>
                        </div>

                        {/* Center: Navigation Pills */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 sm:gap-8">
                            
                            {/* Dashboard Link */}
                            <Link href="/creator/dashboard" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/creator/dashboard') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <Squares2X2Icon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block">Dashboard</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/dashboard') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>

                            {/* Wallet Link */}
                            <Link href="/creator/wallet" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/creator/wallet') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <WalletIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block">Wallet</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/wallet') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                            
                            {/* Messages Link with Unread Badge */}
                            <Link href="/creator/messages" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${isActive('/creator/messages') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1 relative">
                                        <ChatBubbleOvalLeftIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block">Messages</span>
                                        
                                        {/* Dynamic Messages Badge */}
                                        {unreadMessages > 0 && (
                                            <span className="absolute top-0 right-0 sm:-right-2 -mt-1 -mr-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/messages') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>

                        </div>

                        {/* Right: Notifications & Profile Trigger */}
                        <div className="flex items-center gap-3 md:gap-4 shrink-0 relative">
                            
                            {/* Notifications Bell */}
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                            >
                                <BellIcon className="w-6 h-6" />
                                {/* Dynamic Notification Badge */}
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown Container */}
                            {isNotificationsOpen && (
                                <>
                                    {/* Invisible overlay to close dropdown when clicking outside */}
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                                    
                                    <div className="absolute top-14 right-12 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900">Notifications</h3>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{unreadNotificationCount} New</span>
                                        </div>
                                        
                                        <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {notifications.length === 0 ? (
                                                <div className="px-5 py-8 text-center text-sm text-gray-500">
                                                    You're all caught up!
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div 
                                                        key={notif.id}
                                                        onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                                                        className={`px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-indigo-50/50 hover:bg-indigo-50'}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-[#5B4DFF]'}`}></div>
                                                            <div>
                                                                <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                                                    {notif.message}
                                                                </p>
                                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1 block">
                                                                    {notif.type.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Profile Button - Now Dynamic */}
                            <button 
                                onClick={() => setIsProfileOpen(true)}
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs md:text-sm cursor-pointer hover:bg-gray-800 transition-colors shadow-md relative overflow-hidden"
                            >
                                {userProfile?.avatar ? (
                                    <Image src={userProfile.avatar} alt="Profile" fill className="object-cover" />
                                ) : (
                                    <span>{initial}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PROFILE MODAL OVERLAY --- */}
            {isProfileOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white border border-gray-800">
                        <button 
                             onClick={() => setIsProfileOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mt-4">
                            
                            {/* Dynamic Avatar */}
                            <div className="relative mb-4">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden relative">
                                    {userProfile?.avatar ? (
                                        <Image src={userProfile.avatar} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <span className="text-black text-4xl font-bold">{initial}</span>
                                    )}
                                </div>
                            </div>

                            {/* Dynamic Name and Email */}
                            <h2 className="text-2xl font-bold mb-1 text-center truncate w-full px-2">{dispName}</h2>
                            <p className="text-gray-400 text-sm mb-8 text-center truncate w-full px-2">{userEmail}</p>

                            <div className="w-full space-y-3">
                                {/* Route to Settings Page */}
                                <Link 
                                    href="/creator/settings" 
                                    onClick={() => setIsProfileOpen(false)}
                                    className="w-full bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white py-3.5 px-4 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                    <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                                    <span className="font-semibold">Account Settings</span>
                                </Link>

                                {/* Logout Button */}
                                <button 
                                    onClick={handleLogout}
                                    className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 py-3.5 px-4 rounded-xl font-semibold flex items-center gap-3 transition-colors"
                                >
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}