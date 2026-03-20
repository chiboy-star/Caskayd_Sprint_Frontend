"use client";

import { useState, useEffect } from "react";
import NavigationPill from "@/components/NavigationPill";
import { UserIcon, KeyIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success" | "error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            } ${type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function BusinessSettingsPage() {
    const [activeTab, setActiveTab] = useState<"general" | "security" | "danger">("general");
    const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

    // Forms State
    const [isSaving, setIsSaving] = useState(false);
    const [generalData, setGeneralData] = useState({
        companyName: "",
        location: "",
        websiteUrl: "",
        category: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: ""
    });

    const showToast = (message: string, type: "success" | "error") => setToast({ message, type, isVisible: true });

    // Fetch initial profile data
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                const res = await fetch(`${BASE_URL}/users/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const profile = Array.isArray(data) ? (data.find((p: any) => p.companyName) || data[0]) : data;

                    if (profile) {
                        setGeneralData({
                            companyName: profile.companyName || "",
                            location: profile.location || "",
                            websiteUrl: profile.websiteUrl || "",
                            category: profile.category || ""
                        });
                    }
                }
            } catch (error) {
                console.error("🔴 [Network Error] Failed to load profile:", error);
            }
        };

        fetchProfile();
    }, []);

    const handleGeneralSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/user/business/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(generalData)
            });

            if (res.ok) {
                showToast("Profile updated successfully!", "success");
            } else {
                const err = await res.json().catch(() => null);
                showToast(err?.message || "Failed to update profile.", "error");
            }
        } catch (error) {
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/users/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            if (res.ok) {
                showToast("Password changed successfully!", "success");
                setPasswordData({ currentPassword: "", newPassword: "" });
            } else {
                const err = await res.json().catch(() => null);
                showToast(err?.message || "Failed to change password.", "error");
            }
        } catch (error) {
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/users/account`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                showToast("Account deleted successfully.", "success");
                localStorage.clear();
                window.location.href = "/business/login";
            } else {
                const err = await res.json().catch(() => null);
                showToast(err?.message || "Failed to delete account.", "error");
            }
        } catch (error) {
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans">
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
            <NavigationPill />

            <main className="max-w-[90rem] mx-auto px-4 md:px-8 pb-20 pt-[140px] md:pt-[160px] flex flex-col md:flex-row gap-8 items-start">

                {/* --- SIDEBAR --- */}
                <div className="w-full md:w-64 bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold mb-6 px-4 pt-2">Settings</h2>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors cursor-pointer ${activeTab === "general" ? "bg-indigo-50 text-[#5B4DFF]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                        >
                            <UserIcon className="w-5 h-5" />
                            General Info
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors cursor-pointer ${activeTab === "security" ? "bg-indigo-50 text-[#5B4DFF]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                        >
                            <KeyIcon className="w-5 h-5" />
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab("danger")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors cursor-pointer ${activeTab === "danger" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-red-50 hover:text-red-600"}`}
                        >
                            <TrashIcon className="w-5 h-5" />
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 w-full bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 min-h-[500px]">

                    {activeTab === "general" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold mb-8">Profile Information</h2>
                            <form onSubmit={handleGeneralSubmit} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                                        <input type="text" value={generalData.companyName} onChange={(e) => setGeneralData({ ...generalData, companyName: e.target.value })} className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                        <input type="text" value={generalData.location} onChange={(e) => setGeneralData({ ...generalData, location: e.target.value })} placeholder="e.g. Lagos, NG" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="bg-[#00D68F] hover:bg-[#00c080] text-black font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer mt-4">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold mb-8">Change Password</h2>
                            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                    <input type="password" required minLength={6} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="••••••••" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors" />
                                </div>
                                <button type="submit" disabled={isSaving || !passwordData.newPassword} className="bg-[#00D68F] hover:bg-[#00c080] text-black font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer mt-4">
                                    {isSaving ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "danger" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Account</h2>
                            <p className="text-gray-600 mb-8">Are you sure you want to delete your account? This action is permanent and cannot be undone.</p>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isSaving}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? "Deleting..." : "Yes, Delete My Account"}
                            </button>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}