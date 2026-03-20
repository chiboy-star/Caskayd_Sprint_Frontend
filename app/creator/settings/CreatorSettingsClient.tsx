"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill";
import { CheckCircleIcon, XCircleIcon, KeyIcon, UserCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

export default function CreatorSettingsClient() {
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "danger">("profile");
    const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        displayName: "", bio: "", location: "", 
        instagram: "", tiktok: "", pricePerPost: ""
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: "", newPassword: "", confirmPassword: ""
    });

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });

    // --- FETCH INITIAL PROFILE DATA ---
    // Added so the form isn't blank when the user opens the settings page
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                console.log("🔵 [API Request] GET /users/profile");
                const res = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("🟢 [API Response] GET /users/profile SUCCESS:", data);
                    
                    const profile = Array.isArray(data) ? (data.find((p: any) => p.displayName) || data[0]) : data;

                    if (profile) {
                        setProfileData({
                            displayName: profile.displayName || "",
                            bio: profile.bio || "",
                            location: profile.location || "",
                            instagram: profile.instagram || profile.links?.instagram || "",
                            tiktok: profile.tiktok || profile.links?.tiktok || "",
                            pricePerPost: profile.pricePerPost ? String(profile.pricePerPost) : ""
                        });
                    }
                } else {
                    console.error("🔴 [API Error] GET /users/profile FAILED:", await res.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] Failed to load profile:", error);
            }
        };

        fetchProfile();
    }, []);

    // --- SUBMIT PROFILE INFO ---
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsLoading(true);
        try {
            const payload = {
                ...profileData,
                pricePerPost: profileData.pricePerPost ? Number(profileData.pricePerPost) : undefined
            };

            console.log("🔵 [API Request] PATCH /users/profile PAYLOAD:", payload);
            const res = await fetch(`${BASE_URL}/users/profile`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                console.log("🟢 [API Response] PATCH /users/profile SUCCESS:", data);
                showToast("Profile updated successfully", "success");
            } else {
                const err = await res.json().catch(() => null);
                console.error("🔴 [API Error] PATCH /users/profile FAILED:", err || res.statusText);
                showToast(err?.message || "Failed to update profile", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error]:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- SUBMIT PASSWORD CHANGE ---
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return showToast("New passwords do not match", "error");
        }

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsLoading(true);
        try {
            const payload = {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            };

            console.log("🔵 [API Request] PATCH /users/password PAYLOAD:", { ...payload, currentPassword: "***", newPassword: "***" });
            const res = await fetch(`${BASE_URL}/users/password`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                console.log("🟢 [API Response] PATCH /users/password SUCCESS:", data);
                showToast("Password changed successfully", "success");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const err = await res.json().catch(() => null);
                console.error("🔴 [API Error] PATCH /users/password FAILED:", err || res.statusText);
                showToast(err?.message || "Failed to change password", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error]:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- DELETE ACCOUNT ---
    const handleDeleteAccount = async () => {
        // UI Polish: Added safety confirmation
        const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsLoading(true);
        try {
            console.log("🔵 [API Request] DELETE /users/account");
            const res = await fetch(`${BASE_URL}/users/account`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log("🟢 [API Response] DELETE /users/account SUCCESS");
                showToast("Account deleted successfully", "success");
                localStorage.clear();
                window.location.href = "/creator/login";
            } else {
                const err = await res.json().catch(() => ({}));
                console.error("🔴 [API Error] DELETE /users/account FAILED:", err || res.statusText);
                showToast(err?.message || "Failed to delete account", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error]:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // SEO: Structured data for the Profile Page
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "name": "Creator Settings | Caskayd",
        "description": "Manage your Caskayd creator profile settings.",
        "url": "https://www.caskayd.com/creator/settings"
    };

    return (
        <div className={`min-h-screen bg-[#F8F9FB] flex flex-col ${inter.className}`}>
            {/* Inject Structured Data into the DOM */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />
            <CreatorNavigationPill />

            <main className="flex-1 w-full max-w-[90rem] mx-auto px-4 md:px-8 pb-20 pt-[140px] md:pt-[160px] flex flex-col md:flex-row gap-8 items-start">
                
                {/* SEO Fix: Added H1 */}
                <h1 className="sr-only">Creator Account Settings</h1>

                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 shrink-0">
                    {/* SEO Fix: Changed to h2 */}
                    <h2 className="text-xl font-bold text-gray-900 mb-6 px-4 pt-2">Settings</h2>
                    
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                        {/* UI Polish: Changed active theme colors from Indigo to Emerald to match Creator Side */}
                        <button 
                            onClick={() => setActiveTab("profile")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === "profile" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <UserCircleIcon className="w-5 h-5" /> General Info
                        </button>
                        <button 
                            onClick={() => setActiveTab("security")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === "security" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <KeyIcon className="w-5 h-5" /> Security
                        </button>
                        <div className="hidden md:block h-px bg-gray-100 my-2 w-full"></div>
                        <button 
                            onClick={() => setActiveTab("danger")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === "danger" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-red-50 hover:text-red-600"
                            }`}
                        >
                            <TrashIcon className="w-5 h-5" /> Delete Account
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {/* UI Polish: Added max-w-3xl */}
                <div className="flex-1 w-full max-w-3xl bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 min-h-[500px]">
                    
                    {activeTab === "profile" && (
                        <form onSubmit={handleProfileSubmit} className="animate-in fade-in duration-300 space-y-6">
                            {/* SEO Fix: Changed to h2 */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Profile Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                                    <input type="text" value={profileData.displayName} onChange={e => setProfileData({...profileData, displayName: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="e.g. Apex" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                    <input type="text" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="e.g. Lagos, NG" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                                <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={3} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all resize-none" placeholder="Tech content creator..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                                    <input type="text" value={profileData.instagram} onChange={e => setProfileData({...profileData, instagram: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="instagram.com/username" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">TikTok URL</label>
                                    <input type="text" value={profileData.tiktok} onChange={e => setProfileData({...profileData, tiktok: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="tiktok.com/@username" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Per Post (₦)</label>
                                <input type="number" value={profileData.pricePerPost} onChange={e => setProfileData({...profileData, pricePerPost: e.target.value})} className="w-full md:w-1/2 bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="50000" />
                            </div>

                            <div className="pt-6">
                                {/* UI Polish: Changed to Emerald to match Creator Theme */}
                                <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer">
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "security" && (
                        <form onSubmit={handlePasswordSubmit} className="max-w-md animate-in fade-in duration-300 space-y-6">
                            {/* SEO Fix: Changed to h2 */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Change Password</h2>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                                <input type="password" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <input type="password" required minLength={6} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                <input type="password" required minLength={6} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-[#F8F9FB] border border-gray-200 text-gray-900 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all" placeholder="••••••••" />
                            </div>

                            <div className="pt-6">
                                <button type="submit" disabled={isLoading || !passwordData.newPassword} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer">
                                    {isLoading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "danger" && (
                        <div className="animate-in fade-in duration-300">
                            {/* SEO Fix: Changed to h2 */}
                            <h2 className="text-2xl font-bold mb-6 text-red-600 border-b border-red-100 pb-4">Danger Zone</h2>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-red-900 mb-2">Delete Account</h3>
                                <p className="text-red-700 mb-8 text-sm leading-relaxed">Are you sure you want to delete your account? This action is permanent and will remove all your data, campaign history, and settings. This cannot be undone.</p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isLoading}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                                >
                                    {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}