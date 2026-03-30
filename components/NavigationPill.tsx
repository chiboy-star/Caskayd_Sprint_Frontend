"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
    ChatBubbleOvalLeftIcon, 
    MapIcon, 
    XMarkIcon, 
    CameraIcon, 
    ArrowRightOnRectangleIcon,
    BellIcon,
    CheckCircleIcon,
    XCircleIcon,
    PaperAirplaneIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "react-hot-toast"; // Or use your custom Toast

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AppNotification {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
}

// Show temporary feedback messages to the user
const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 4000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
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
    
    // Store user profile data
    const [userProfile, setUserProfile] = useState<{ email?: string; avatar?: string; companyName?: string; displayName?: string } | null>(null);

    // Notification and unread state
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<number>(0);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    
    // Sent invites counter
    const [sentCount, setSentCount] = useState<number>(0);
    const [showSentCount, setShowSentCount] = useState(false);
    
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });
    const isActive = (path: string) => pathname?.includes(path);
    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

    // Fetch initial data on mount and poll alerts
    usePushNotifications((payload) => {
    // This runs when a message hits while the app is actively open
    const title = payload?.notification?.title || "New Message";
    const body = payload?.notification?.body || "You have a new message.";
    
    // Fire your custom toast or react-hot-toast
    showToast(`${title}: ${body}`, "success");
    
    // You can also manually increment your unreadMessages state here!
    setUnreadMessages(prev => prev + 1);
});

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const fetchUserProfile = async () => {
            try {
                console.log("🔵 [API Request] GET /users/profile | Sent: No body");
                const profileRes = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    console.log("🟢 [API Response] GET /users/profile SUCCESS:", profileData);
                    
                    if (Array.isArray(profileData) && profileData.length > 0) {
                        const activeBusinessProfile = profileData.find((p: any) => p.companyName) || profileData[0];
                        setUserProfile(activeBusinessProfile);
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
            // Fetch unread message count
            try {
                console.log("🔵 [API Request] GET /messages/unread/count | Sent: No body");
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

            // Fetch app notifications
            try {
                console.log("🔵 [API Request] GET /notifications | Sent: No body");
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

            // Fetch sent chat requests count
            try {
                console.log("🔵 [API Request] GET /chat-requests/business/sent-count | Sent: No body");
                const sentRes = await fetch(`${BASE_URL}/chat-requests/business/sent-count`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (sentRes.ok) {
                    const countData = await sentRes.text();
                    let parsedCount = 0;
                    try {
                        const parsed = JSON.parse(countData);
                        parsedCount = typeof parsed === 'number' ? parsed : (parsed?.count || 0);
                    } catch {
                        parsedCount = Number(countData) || 0;
                    }
                    console.log("🟢 [API Response] GET /chat-requests/business/sent-count SUCCESS:", parsedCount);
                    setSentCount(parsedCount);
                } else {
                    console.error("🔴 [API Error] GET /chat-requests/business/sent-count FAILED:", await sentRes.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /chat-requests/business/sent-count crashed:", error);
            }

            try {
                const msgRes = await fetch(`${BASE_URL}/messages/unread/count`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (msgRes.ok) {
                    const msgCount = await msgRes.text(); 
                    const count = Number(msgCount) || 0;
                    setUnreadMessages(count);

                    // --- NEW: UPDATE THE APP ICON BADGE ---
                    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
                        if (count > 0) {
                            navigator.setAppBadge(count); // Shows the red dot with the number
                        } else {
                            navigator.clearAppBadge(); // Removes the red dot when read
                        }
                    }
                    // --------------------------------------

                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /messages/unread/count crashed:", error);
            }
        };

        fetchUserProfile(); 
        fetchAlerts();      
        const interval = setInterval(fetchAlerts, 15000); 
        return () => clearInterval(interval);
    }, []);

    // Mark a notification as read locally and on the server
    const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return; 

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

        try {
            console.log(`🔵 [API Request] PATCH /notifications/${id}/read | Sent: No body`);
            const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`🔴 [API Error] PATCH /notifications/${id}/read FAILED:`, errorText);
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            } else {
                console.log(`🟢 [API Response] PATCH /notifications/${id}/read SUCCESS`);
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

        const formData = new FormData();
        formData.append("file", file);

        try {
            console.log("🔵 [API Request] POST /upload/avatar");
            const res = await fetch(`${BASE_URL}/upload/avatar`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData, 
            });

            if (res.ok) {
                const data = await res.json();
                console.log("🟢 [API Response] POST /upload/avatar SUCCESS", data);
                
                showToast("Profile image updated successfully!", "success");
                
                const newAvatarUrl = data.url || URL.createObjectURL(file);
                setUserProfile(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
            } else {
                const errorData = await res.json().catch(() => null);
                console.error("🔴 [API Error] POST /upload/avatar FAILED:", errorData);
                showToast(`Failed to update: ${errorData?.message || "Bad Request"}`, "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] POST /upload/avatar crashed:", error);
            showToast("Network error. Please try again later.", "error");
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = ""; 
        }
    };

    // Logout and clear tokens
    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        router.push("/business/login");
    };

    // Display Name Fallback logic
    const dispName = userProfile?.displayName || userProfile?.companyName || "Business Account";
    const userEmail = userProfile?.email || "business@example.com";
    const initial = dispName.charAt(0).toUpperCase();

    return (
        <>
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />

            <div className="fixed top-0 left-0 right-0 z-40 w-full px-4 md:px-8 pt-6 pb-4 bg-white/70 backdrop-blur-md border-b border-white/10 transition-all">
                <div className="max-w-5xl mx-auto">
                    
                    {/* Main Nav Container */}
                    <div className="bg-white rounded-full shadow-lg shadow-gray-200/50 border border-gray-100 py-3 md:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-between relative gap-1 sm:gap-4">
                        
                        {/* Responsive Logo Container */}
                        <Link href="/" className="flex items-center gap-2 md:gap-3 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <div className="relative w-40 h-10 shrink-0 hidden sm:block">
                                <Image 
                                    src="/images/LandingLogo.png" 
                                    alt="Caskayd" 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="relative w-8 h-8 shrink-0 sm:hidden">
                                <Image 
                                    src="/images/Logo_transparent_icon.png" 
                                    alt="Caskayd Icon" 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        </Link>

                        {/* Central Pill Menu */}
                        <div className="flex flex-1 justify-center items-center gap-4 sm:gap-6 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                            <Link href="/business/discover" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive('/business/discover') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1">
                                        <MapIcon className="w-6 h-6 sm:w-5 sm:h-5" /> 
                                        <span className="hidden sm:block text-[15px]">Discover</span>
                                    </div>
                                    <div className={`hidden sm:block w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/business/discover') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                            
                            <Link href="/business/messages" className="group">
                                <div className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${isActive('/business/messages') ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-900'}`}>
                                    <div className="flex items-center gap-2 font-bold p-1 relative">
                                        <ChatBubbleOvalLeftIcon className="w-6 h-6 sm:w-5 sm:h-5" /> 
                                        <span className="hidden sm:block text-[15px]">Messages</span>
                                        {unreadMessages > 0 && (
                                            <span className="absolute top-0 right-0 sm:-right-2 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`hidden sm:block w-1.5 h-1.5 rounded-full bg-emerald-500 transition-opacity ${isActive('/business/messages') ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>
                            </Link>
                        </div>

                        {/* Right Section Icons */}
                        <div className="flex items-center gap-1 sm:gap-4 shrink-0 relative z-10">
                            
                            {/* Sent Invites Button */}
                            <div className="relative flex items-center">
                                <button 
                                    onClick={() => setShowSentCount(!showSentCount)}
                                    className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                                >
                                    <PaperAirplaneIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                                </button>
                                {showSentCount && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowSentCount(false)}></div>
                                        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-36 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-4 items-center">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 text-center">Invites Sent</span>
                                            <span className="text-2xl font-black text-emerald-600">{sentCount}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Notifications Button & Dropdown UI */}
                            <div className="relative flex items-center">
                                <button 
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                                >
                                    <BellIcon className="w-6 h-6 sm:w-7 sm:h-7" /> 
                                    {unreadNotificationCount > 0 && (
                                        <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                        </span>
                                    )}
                                </button>

                                {/* Added the missing Dropdown UI for notifications */}
                                {isNotificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                                        <div className="absolute top-14 right-0 md:-right-10 w-[300px] sm:w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px]">
                                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                                {unreadNotificationCount > 0 && (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wider">
                                                        {unreadNotificationCount} New
                                                    </span>
                                                )}
                                            </div>
                                            <div className="overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-1">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-400 text-sm">You're all caught up!</div>
                                                ) : (
                                                    notifications.map((notif) => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                                                            className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 items-start ${notif.isRead ? 'opacity-60 hover:bg-gray-50' : 'bg-emerald-50/50 hover:bg-emerald-100/50'}`}
                                                        >
                                                            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-emerald-500'}`}></div>
                                                            <div className="flex flex-col">
                                                                <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{notif.message}</p>
                                                                <span className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider font-bold">{notif.type}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile Button */}
                            <button 
                                onClick={() => setIsProfileOpen(true)}
                                className="w-10 h-10 md:w-11 md:h-11 ml-1 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors shadow-md relative overflow-hidden shrink-0"
                            >
                                <div className="absolute inset-[2px] rounded-full flex items-center justify-center overflow-hidden">
                                    {userProfile?.avatar ? (
                                        <Image src={userProfile.avatar} alt="Profile" fill className="object-cover rounded-full" />
                                    ) : (
                                        <span className="text-white font-bold">{initial}</span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PROFILE MODAL OVERLAY --- */}
            {isProfileOpen && (
                <div onClick={() => setIsProfileOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50  animate-in fade-in duration-300">
                    <div onClick={(e) => e.stopPropagation()} className="bg-[#0A0A0A]/50 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white border border-white/10 overflow-hidden">
                        
                        <button 
                            onClick={() => setIsProfileOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mt-2 animate-in slide-in-from-left-4 duration-300">
                            
                            <div className="relative mb-4 group cursor-pointer">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden relative border border-gray-700">
                                    {userProfile?.avatar ? (
                                        <Image src={userProfile.avatar} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <span className="text-black text-4xl font-bold">{initial}</span>
                                    )}
                                </div>

                                <label className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200 z-10">
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
                                    href="/business/settings" 
                                    onClick={() => setIsProfileOpen(false)}
                                    className="w-full bg-white/10 border border-white/5 hover:bg-white/20 text-white py-3.5 px-4 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                    <Cog6ToothIcon className="w-5 h-5 text-gray-300" />
                                    <span className="font-semibold text-sm">Account Settings</span>
                                </Link>

                                <button 
                                    onClick={handleLogout}
                                    className="w-full bg-red-500/20 border hover:bg-black text-red-500 py-3.5 px-4 rounded-xl font-semibold flex items-center gap-3 transition-colors cursor-pointer"
                                >
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                    <span className="font-semibold text-sm">Log Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}