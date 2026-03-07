"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
    ChatBubbleOvalLeftIcon, 
    GlobeAltIcon, 
    XMarkIcon, 
    CameraIcon, 
    ArrowRightOnRectangleIcon,
    BellIcon,
    KeyIcon, 
    CheckCircleIcon,
    XCircleIcon,
    ArrowLeftIcon 
} from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AppNotification {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
}

// --- TOAST COMPONENT ---
const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 4000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function NavigationPill() {
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // --- USER PROFILE STATE ---
    // Flow: Holds the data fetched from GET /users/profiles
    const [userProfile, setUserProfile] = useState<{ email?: string; avatar?: string; companyName?: string; displayName?: string } | null>(null);

    // --- NOTIFICATIONS & MESSAGES ---
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // --- SETTINGS / PASSWORD STATES ---
    const [view, setView] = useState<"profile" | "password">("profile");
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [isUpdating, setIsUpdating] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });
    const isActive = (path: string) => pathname?.includes(path);
    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

    // --- FETCH LOGIC ---
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        // Flow: Fetch static user profile data ONCE when the component mounts
        const fetchUserProfile = async () => {
            try {
                console.log("🔵 [Business API Request] GET /users/profiles");
                const profileRes = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    console.log("🟢 [Business API Response] GET /users/profiles SUCCESS:", profileData);
                    
                    // Handle both Array and Object responses safely
                    if (Array.isArray(profileData) && profileData.length > 0) {
                        const activeBusinessProfile = profileData.find((p: any) => p.companyName) || profileData[0];
                        setUserProfile(activeBusinessProfile);
                    } else if (profileData && typeof profileData === 'object') {
                        setUserProfile(profileData);
                    }

                } else {
                    console.error("🔴 [Business API Error] GET /users/profiles FAILED:", await profileRes.text());
                }
            } catch (error) {
                console.error("🔴 [Business Network Error] GET /users/profiles crashed:", error);
            }
        };

        // Flow: Polling function for live alerts
        const fetchAlerts = async () => {
            try {
                const msgRes = await fetch(`${BASE_URL}/messages/unread/count`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (msgRes.ok) {
                    const msgCount = await msgRes.text(); 
                    setUnreadMessages(Number(msgCount) || 0);
                }
            } catch (error) {
                console.error("🔴 [Business Network Error] GET /messages/unread/count crashed:", error);
            }

            try {
                const notifRes = await fetch(`${BASE_URL}/notifications`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    setNotifications(notifData);
                }
            } catch (error) {
                console.error("🔴 [Business Network Error] GET /notifications crashed:", error);
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
            console.log(`🔵 [Business API Request] PATCH /notifications/${id}/read`);
            const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log(`🟢 [Business API Response] PATCH /notifications/${id}/read SUCCESS`);
            } else {
                console.error(`🔴 [Business API Error] PATCH /notifications/${id}/read FAILED:`, await res.text());
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            }
        } catch (error) {
            console.error(`🔴 [Business Network Error] PATCH /notifications/${id}/read crashed:`, error);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
        }
    };

    // --- HANDLE PASSWORD CHANGE ---
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUpdating(true);
        try {
            console.log("🔵 [API Request] PATCH /users/password", passwordData);
            const res = await fetch(`${BASE_URL}/users/password`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(passwordData)
            });

            if (res.ok) {
                console.log("🟢 [API Response] PATCH /users/password SUCCESS");
                showToast("Password updated successfully", "success");
                setPasswordData({ currentPassword: "", newPassword: "" });
                setView("profile"); 
            } else {
                const err = await res.json();
                console.error("🔴 [API Error] PATCH /users/password FAILED:", err);
                showToast(err.message || "Failed to update password", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error]:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        router.push("/business/login");
    };

    // --- DYNAMIC UI HELPERS & FALLBACKS ---
    const compName = userProfile?.companyName || "Your Company";
    const dispName = userProfile?.displayName || "Business Account";
    const userEmail = userProfile?.email || "business@example.com";
    const initial = compName.charAt(0).toUpperCase();

    return (
        <>
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />

            {/* --- NAVIGATION PILL --- */}
            <div className="fixed top-0 left-0 right-0 z-40 w-full px-4 md:px-8 py-4 bg-white/70 backdrop-blur-md border-b border-white/10 transition-all">
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
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 sm:gap-8">
                            <Link href="/business/discover" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/business/discover') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <GlobeAltIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block">Discover</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/business/discover') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                            
                            <Link href="/business/messages" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${isActive('/business/messages') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1 relative">
                                        <ChatBubbleOvalLeftIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block">Messages</span>
                                        {unreadMessages > 0 && (
                                            <span className="absolute top-0 right-0 sm:-right-2 -mt-1 -mr-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/business/messages') ? 'opacity-100' : 'opacity-0'}`}></div>
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
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown Container */}
                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute top-14 right-12 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900">Notifications</h3>
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{unreadNotificationCount} New</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {notifications.length === 0 ? (
                                                <div className="px-5 py-8 text-center text-sm text-gray-500">You're all caught up!</div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div key={notif.id} onClick={() => handleMarkAsRead(notif.id, notif.isRead)} className={`px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors ${notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-indigo-50/50 hover:bg-indigo-50'}`}>
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-[#5B4DFF]'}`}></div>
                                                            <div>
                                                                <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{notif.message}</p>
                                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1 block">{notif.type.replace('_', ' ')}</span>
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
                                onClick={() => { setIsProfileOpen(true); setView("profile"); }}
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
                    
                    <div className="bg-[#0A0A0A] w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white border border-gray-800 overflow-hidden">
                        
                        <button 
                            onClick={() => setIsProfileOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        {/* === PROFILE VIEW === */}
                        {view === "profile" && (
                            <div className="flex flex-col items-center mt-2 animate-in slide-in-from-left-4 duration-300">
                                
                                {/* Dynamic Avatar */}
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden relative">
                                        {userProfile?.avatar ? (
                                            <Image src={userProfile.avatar} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <span className="text-black text-4xl font-bold">{initial}</span>
                                        )}
                                    </div>
                                    <button className="absolute bottom-0 right-0 bg-white text-black p-1.5 rounded-full shadow-lg hover:bg-gray-200 transition-colors">
                                        <CameraIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Dynamic Company Name and Display Name */}
                                <h2 className="text-2xl font-bold mb-1 text-center truncate w-full px-2">{compName}</h2>
                                <p className="text-gray-400 text-sm mb-8 text-center truncate w-full px-2">{dispName}</p>

                                <div className="w-full space-y-3">
                                    {/* Email Display (Replaced Location) */}
                                    <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs text-gray-500 font-medium mb-1">Email Address</span>
                                            <span className="text-sm font-medium truncate w-[240px]">{userEmail}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button 
                                            onClick={() => setView("password")}
                                            className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                                        >
                                            <KeyIcon className="w-4 h-4" /> Password
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm border border-red-500/20"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* === PASSWORD VIEW === */}
                        {view === "password" && (
                            <div className="flex flex-col mt-2 animate-in slide-in-from-right-4 duration-300">
                                <button onClick={() => setView("profile")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-semibold w-fit">
                                    <ArrowLeftIcon className="w-4 h-4" /> Back
                                </button>
                                
                                <h2 className="text-2xl font-bold mb-6 text-center">Change Password</h2>

                                <form onSubmit={handlePasswordSubmit} className="space-y-4 w-full">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-medium mb-1.5 pl-1">Current Password</label>
                                        <input 
                                            type="password" required 
                                            value={passwordData.currentPassword} 
                                            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" 
                                            placeholder="••••••••" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-medium mb-1.5 pl-1">New Password</label>
                                        <input 
                                            type="password" required minLength={6}
                                            value={passwordData.newPassword} 
                                            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                                            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" 
                                            placeholder="••••••••" 
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isUpdating || !passwordData.currentPassword || !passwordData.newPassword}
                                        className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4"
                                    >
                                        {isUpdating ? "Updating..." : "Save Password"}
                                    </button>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
}