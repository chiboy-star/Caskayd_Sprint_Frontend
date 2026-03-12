"use client";

import { useState,useEffect } from "react";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill";
import { CheckCircleIcon, XCircleIcon, KeyIcon, UserCircleIcon } from "@heroicons/react/24/outline";

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
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function CreatorSettingsPage() {
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
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

            console.log("🔵 [API Request] PATCH /users/profile", payload);
            const res = await fetch(`${BASE_URL}/users/profile`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log("🟢 [API Response] PATCH /users/profile SUCCESS");
                showToast("Profile updated successfully", "success");
            } else {
                const err = await res.json();
                console.error("🔴 [API Error] PATCH /users/profile FAILED:", err);
                showToast(err.message || "Failed to update profile", "error");
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

            console.log("🔵 [API Request] PATCH /users/password", payload);
            const res = await fetch(`${BASE_URL}/users/password`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log("🟢 [API Response] PATCH /users/password SUCCESS");
                showToast("Password changed successfully", "success");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const err = await res.json();
                console.error("🔴 [API Error] PATCH /users/password FAILED:", err);
                showToast(err.message || "Failed to change password", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error]:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-[#F8F9FB] flex flex-col ${inter.className}`}>
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />
            <CreatorNavigationPill />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-32 pb-20">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-6 shrink-0">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">Settings</h2>
                        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                            <button 
                                onClick={() => setActiveTab("profile")}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                    activeTab === "profile" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                <UserCircleIcon className="w-5 h-5" /> General Info
                            </button>
                            <button 
                                onClick={() => setActiveTab("security")}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                    activeTab === "security" ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                <KeyIcon className="w-5 h-5" /> Security
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 md:p-10">
                        {activeTab === "profile" && (
                            <form onSubmit={handleProfileSubmit} className="max-w-xl animate-in fade-in duration-300 space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                                        <input type="text" value={profileData.displayName} onChange={e => setProfileData({...profileData, displayName: e.target.value})} className="w-full bg-gray-50 text-black border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="Apex" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                        <input type="text" value={profileData.location} onChange={e => setProfileData({...profileData, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl text-black py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="Lagos, NG" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                                    <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 text-black focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="Tech content creator..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                                        <input type="text" value={profileData.instagram} onChange={e => setProfileData({...profileData, instagram: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-black rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="instagram.com/username" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">TikTok URL</label>
                                        <input type="text" value={profileData.tiktok} onChange={e => setProfileData({...profileData, tiktok: e.target.value})} className="w-full bg-gray-50 border text-black border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="tiktok.com/@username" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Per Post (₦)</label>
                                    <input type="number" value={profileData.pricePerPost} onChange={e => setProfileData({...profileData, pricePerPost: e.target.value})} className="w-full md:w-1/2 bg-gray-50 border text-black border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="50000" />
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md disabled:opacity-50 transition-colors">
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === "security" && (
                            <form onSubmit={handlePasswordSubmit} className="max-w-md animate-in fade-in duration-300 space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h3>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                                    <input type="password" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full bg-gray-50 border text-black border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                    <input type="password" required minLength={6} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-gray-50 border text-black border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                    <input type="password" required minLength={6} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-gray-50 text-black border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                                </div>

                                <div className="pt-4">
                                    <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md disabled:opacity-50 transition-colors">
                                        {isLoading ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
} 