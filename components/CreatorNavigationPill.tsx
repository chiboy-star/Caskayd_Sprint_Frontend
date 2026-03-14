"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast"; // Added react-hot-toast
import { 
    ChatBubbleOvalLeftIcon, 
    WalletIcon, 
    Squares2X2Icon, 
    XMarkIcon, 
    ArrowRightOnRectangleIcon,
    BellIcon,
    Cog6ToothIcon,
    CameraIcon 
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
    
    const [userProfile, setUserProfile] = useState<{ email?: string; avatar?: string; displayName?: string; companyName?: string } | null>(null);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const isActive = (path: string) => pathname?.includes(path);
    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        router.push("/creator/login");
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const fetchUserProfile = async () => {
            try {
                console.log("🔵 [API Request] GET /users/profile");
                const profileRes = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    console.log("🟢 [API Response] GET /users/profile SUCCESS:", profileData);
                    
                    if (Array.isArray(profileData) && profileData.length > 0) {
                        const activeCreatorProfile = profileData.find((p: any) => p.displayName) || profileData[0];
                        setUserProfile(activeCreatorProfile);
                    } else if (profileData && typeof profileData === 'object') {
                        setUserProfile(profileData);
                    }
                } else {
                    console.error("🔴 [API Error] GET /users/profile FAILED:", await profileRes.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /users/profile crashed:", error);
            }
        };

        const fetchAlerts = async () => {
            try {
                console.log("🔵 [API Request] GET /messages/unread/count");
                const msgRes = await fetch(`${BASE_URL}/messages/unread/count`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (msgRes.ok) {
                    const msgCount = await msgRes.text(); 
                    console.log("🟢 [API Response] GET /messages/unread/count SUCCESS:", msgCount);
                    setUnreadMessages(Number(msgCount) || 0);
                } else {
                    console.error("🔴 [API Error] GET /messages/unread/count FAILED:", await msgRes.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /messages/unread/count crashed:", error);
            }

            try {
                console.log("🔵 [API Request] GET /notifications");
                const notifRes = await fetch(`${BASE_URL}/notifications`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    console.log("🟢 [API Response] GET /notifications SUCCESS:", notifData);
                    setNotifications(notifData);
                } else {
                    console.error("🔴 [API Error] GET /notifications FAILED:", await notifRes.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /notifications crashed:", error);
            }
        };

        fetchUserProfile(); 
        fetchAlerts();      
        const interval = setInterval(fetchAlerts, 15000); 
        return () => clearInterval(interval);
    }, []);

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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUploadingAvatar(true);
        const loadingToastId = toast.loading("Updating profile image...");

        const formData = new FormData();
        // CHANGED: "avatar" to "file". Update this string if your backend expects a different field name (e.g., "image").
        formData.append("file", file);

        try {
            console.log("🔵 [API Request] PATCH /users/me/avatar");
            const res = await fetch(`${BASE_URL}/users/me/avatar`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData, 
            });

            if (res.ok) {
                const data = await res.json();
                console.log("🟢 [API Response] PATCH /users/me/avatar SUCCESS", data);
                
                toast.success("Profile image updated successfully!", { id: loadingToastId });
                
                const newAvatarUrl = data.avatar || URL.createObjectURL(file);
                setUserProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
            } else {
                const errorData = await res.json().catch(() => null);
                console.error("🔴 [API Error] PATCH /users/me/avatar FAILED:", errorData);
                toast.error(`Failed to update: ${errorData?.message || "Bad Request"}`, { id: loadingToastId });
            }
        } catch (error) {
            console.error("🔴 [Network Error] PATCH /users/me/avatar crashed:", error);
            toast.error("Network error. Please try again later.", { id: loadingToastId });
        } finally {
            setIsUploadingAvatar(false);
        }
    };
    
    const dispName = userProfile?.displayName || userProfile?.companyName || "Creator";
    const userEmail = userProfile?.email || "creator@example.com";
    const initial = dispName.charAt(0).toUpperCase();

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 w-full px-4 md:px-8 pt-6 pb-4 bg-white/70 backdrop-blur-md border-b border-white/10 transition-all">
                <div className="max-w-5xl mx-auto">
                    
                    <div className="bg-white rounded-full shadow-lg shadow-gray-200/50 border border-gray-100 py-4 px-6 md:px-8 flex items-center justify-between relative">
                        
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <div className="relative w-10 h-10 shrink-0">
                                <Image 
                                    src="/images/Logo_transparent_icon.png" 
                                    alt="Caskayd" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight hidden sm:block text-slate-900">
                                Caskayd
                            </span>
                        </div>

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 sm:gap-10">
                            <Link href="/creator/dashboard" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/creator/dashboard') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <Squares2X2Icon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block text-[15px]">Dashboard</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/dashboard') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>

                            <Link href="/creator/wallet" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/creator/wallet') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <WalletIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block text-[15px]">Wallet</span>
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/wallet') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                            
                            <Link href="/creator/messages" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${isActive('/creator/messages') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1 relative">
                                        <ChatBubbleOvalLeftIcon className="w-6 h-6 sm:w-5 sm:h-5" />
                                        <span className="hidden sm:block text-[15px]">Messages</span>
                                        {unreadMessages > 0 && (
                                            <span className="absolute top-0 right-0 sm:-right-2 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/creator/messages') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 md:gap-5 shrink-0 relative">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                            >
                                <BellIcon className="w-7 h-7" />
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                                    <div className="absolute top-16 right-12 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
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

                            <button 
                                onClick={() => setIsProfileOpen(true)}
                                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors shadow-md relative overflow-hidden"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A]/50 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white border border-white/10">
                        <button 
                            onClick={() => setIsProfileOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer z-10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mt-4 relative z-0">
                            
                            {/* Updated Profile Avatar with side-badge camera icon */}
                            <div className="relative mb-4 group cursor-pointer">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden relative border border-gray-700">
                                    {userProfile?.avatar ? (
                                        <Image src={userProfile.avatar} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <span className="text-black text-4xl font-bold">{initial}</span>
                                    )}
                                </div>
                                
                                {/* White floating camera badge positioned bottom-right */}
                                <label className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                                    {isUploadingAvatar ? (
                                        <div className="w-4 h-4 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <CameraIcon className="w-5 h-5 text-gray-800" />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleAvatarUpload}
                                        disabled={isUploadingAvatar}
                                    />
                                </label>
                            </div>

                            <h2 className="text-2xl font-bold mb-1 text-center truncate w-full px-2">{dispName}</h2>
                            <p className="text-gray-400 text-sm mb-8 text-center truncate w-full px-2">{userEmail}</p>

                            <div className="w-full space-y-3">
                                <Link 
                                    href="/creator/settings" 
                                    onClick={() => setIsProfileOpen(false)}
                                    className="w-full bg-white/10 border border-white/5 hover:bg-white/20 text-white py-3.5 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                    <Cog6ToothIcon className="w-5 h-5 text-gray-300" />
                                    <span className="font-semibold">Account Settings</span>
                                </Link>

                                <button 
                                    onClick={handleLogout}
                                    className="w-full bg-red-500/20 border hover:bg-black text-red-500 py-3.5 px-4 rounded-xl font-semibold flex items-center gap-3 transition-colors cursor-pointer"
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