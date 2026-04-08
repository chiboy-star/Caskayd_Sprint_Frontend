"use client";

import { useState, useEffect } from "react";
import NavigationPill from "@/components/NavigationPill";
import { UserIcon, KeyIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AVAILABLE_INDUSTRIES = ["Fashion","Lifestyle","Events","Food & Food Stuff","Beverages","Electronics/Gadgets","Gifts & Gift packages","Arts & Crafts","Retail (General)","Clothing","Jewelry & Accessories","Footwear","Extensions","Bags","Perfumes","Skincare","Transportation / Travel","Hospitality Services","Product Customization"];

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

export default function BusinessSettingsClient() {
    const [activeTab, setActiveTab] = useState<"general" | "security" | "danger">("general");
    const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

    const [isSaving, setIsSaving] = useState(false);
    
    // Updated category to be an array of strings instead of a single string
    const [generalData, setGeneralData] = useState({
        companyName: "",
        location: "",
        websiteUrl: "",
        category: [] as string[] 
    });
    
    const [resetStep, setResetStep] = useState<1 | 2>(1);
    const [resetData, setResetData] = useState({ email: "", code: "", newPassword: "" });

    const showToast = (message: string, type: "success" | "error") => setToast({ message, type, isVisible: true });

    // Fetch the business profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                console.log(`[API CALL] GET ${BASE_URL}/users/business/profile`);
                
                const res = await fetch(`${BASE_URL}/users/business/profile`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log(`[API RESPONSE] Profile loaded:`, data);
                    
                    const profile = Array.isArray(data) ? (data.find((p: any) => p.companyName) || data[0]) : data;

                    if (profile) {
                        // Ensure we parse the category correctly if the backend returns a string or array
                        let parsedCategory: string[] = [];
                        if (Array.isArray(profile.category)) {
                            parsedCategory = profile.category;
                        } else if (typeof profile.category === 'string' && profile.category) {
                            parsedCategory = profile.category.split(',').map((c: string) => c.trim());
                        }

                        setGeneralData({
                            companyName: profile.companyName || "",
                            location: profile.location || "",
                            websiteUrl: profile.websiteUrl || "",
                            category: parsedCategory
                        });
                    }
                } else {
                    console.log(`[API ERROR] Profile fetch failed with status:`, res.status);
                    showToast("Failed to load profile data.", "error");
                }
            } catch (error) {
                console.error(`[API CATCH ERROR] Fetch profile:`, error);
                showToast("Network error while loading profile.", "error");
            }
        };

        fetchProfile();
    }, []);

    // Handle adding and removing categories from the multi-select
    const toggleCategory = (industry: string) => {
        setGeneralData(prev => {
            const currentCategories = prev.category;
            
            if (currentCategories.includes(industry)) {
                // If it's already selected, remove it
                return { ...prev, category: currentCategories.filter(c => c !== industry) };
            } else {
                // If it's not selected, enforce the maximum limit of 3
                if (currentCategories.length >= 3) {
                    showToast("You can only select up to 3 categories.", "error");
                    return prev;
                }
                // Add the new selection
                return { ...prev, category: [...currentCategories, industry] };
            }
        });
    };

    // Save profile changes
// Save profile changes
// Save profile changes
    const handleGeneralSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsSaving(true);
        try {
            const payload = {
                ...generalData,
                category: generalData.category.join(", ")
            };

            console.log(`[API CALL] PATCH ${BASE_URL}/users/business/profile`);
            console.log(`[API PAYLOAD] Update profile:`, payload);

            const res = await fetch(`${BASE_URL}/users/business/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                // Send the modified payload instead of generalData
                body: JSON.stringify(payload) 
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[API RESPONSE] Profile updated:`, data);
                showToast("Profile updated successfully!", "success");
            } else {
                const err = await res.json().catch(() => null);
                console.log(`[API ERROR] Profile update failed:`, err);
                showToast(err?.message || "Failed to update profile.", "error");
            }
        } catch (error) {
            console.error(`[API CATCH ERROR] Profile update:`, error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Request the OTP to reset password
    const handleRequestPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.email) return showToast("Please enter your email", "error");

        setIsSaving(true);
        try {
            const payload = { email: resetData.email };
            
            console.log(`[API CALL] POST ${BASE_URL}/auth/forgot-password`);
            console.log(`[API PAYLOAD] Request reset code:`, payload);

            const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[API RESPONSE] Reset code sent:`, data);
                showToast("Reset code sent to your email!", "success");
                setResetStep(2); 
            } else {
                const data = await res.json().catch(() => ({}));
                console.log(`[API ERROR] Reset code request failed:`, data);
                showToast(data.message || "Failed to send reset email.", "error");
            }
        } catch (error) {
            console.error(`[API CATCH ERROR] Request reset code:`, error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Submit the OTP and the new password
    const handleSubmitNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.code || !resetData.newPassword) return showToast("Please fill all fields", "error");

        setIsSaving(true);
        try {
            const payload = { email: resetData.email, code: resetData.code, newPassword: resetData.newPassword };
            
            console.log(`[API CALL] POST ${BASE_URL}/auth/reset-password`);
            console.log(`[API PAYLOAD] Submit new password:`, { email: payload.email, code: payload.code, newPassword: "[REDACTED]" });

            const res = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[API RESPONSE] Password updated:`, data);
                showToast("Password updated successfully!", "success");
                setResetStep(1);
                setResetData({ email: "", code: "", newPassword: "" });
            } else {
                const data = await res.json().catch(() => ({}));
                console.log(`[API ERROR] Password update failed:`, data);
                showToast(data.message || "Failed to update password.", "error");
            }
        } catch (error) {
            console.error(`[API CATCH ERROR] Submit new password:`, error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Permanently delete user account
    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsSaving(true);
        try {
            console.log(`[API CALL] DELETE ${BASE_URL}/users/account`);

            const res = await fetch(`${BASE_URL}/users/account`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log(`[API RESPONSE] Account deleted.`);
                showToast("Account deleted successfully.", "success");
                localStorage.removeItem("accessToken");
                window.location.href = "/business/login";
            } else {
                const err = await res.json().catch(() => null);
                console.log(`[API ERROR] Delete account failed:`, err);
                showToast(err?.message || "Failed to delete account.", "error");
            }
        } catch (error) {
            console.error(`[API CATCH ERROR] Delete account:`, error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "name": "Business Settings | Caskayd",
        "description": "Manage your Caskayd business profile settings.",
        "url": "https://www.caskayd.com/business/settings"
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
            <NavigationPill />

            <main className="max-w-[90rem] mx-auto px-4 md:px-8 pb-20 pt-[140px] md:pt-[160px] flex flex-col md:flex-row gap-8 items-start">
                
                <h1 className="sr-only">Business Settings</h1>

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold mb-6 px-4 pt-2 text-black">Settings</h2>
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
                        <div className="h-px bg-gray-100 my-2 w-full"></div> 
                        <button
                            onClick={() => setActiveTab("danger")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors cursor-pointer ${activeTab === "danger" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-red-50 hover:text-red-600"}`}
                        >
                            <TrashIcon className="w-5 h-5" />
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 w-full max-w-3xl bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 min-h-[500px]">

                    {activeTab === "general" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Profile Information</h2>
                            <form onSubmit={handleGeneralSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                                        <input type="text" value={generalData.companyName} onChange={(e) => setGeneralData({ ...generalData, companyName: e.target.value })} className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                        <input type="text" value={generalData.location} onChange={(e) => setGeneralData({ ...generalData, location: e.target.value })} placeholder="e.g. Lagos, NG" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                                        <input type="url" value={generalData.websiteUrl} onChange={(e) => setGeneralData({ ...generalData, websiteUrl: e.target.value })} placeholder="https://yourwebsite.com" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                </div>

                                {/* Category Multi-Select */}
                                <div className="pt-2">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-sm font-semibold text-gray-700">Categories</label>
                                        <span className="text-xs font-medium text-gray-500">
                                            {generalData.category.length} / 3 selected (Min 2)
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_INDUSTRIES.map((industry) => {
                                            const isSelected = generalData.category.includes(industry);
                                            return (
                                                <button
                                                    key={industry}
                                                    type="button"
                                                    onClick={() => toggleCategory(industry)}
                                                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                                                        isSelected 
                                                        ? "bg-indigo-50 border-[#5B4DFF] text-[#5B4DFF]" 
                                                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {industry}
                                                </button>
                                            );
                                        })}
                                    </div>
                                   
                                </div>

                                <div className="pt-6">
                                    <button type="submit" disabled={isSaving} className="bg-[#5B4DFF] hover:bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer">
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Reset Password</h2>
                            
                            {resetStep === 1 ? (
                                <form onSubmit={handleRequestPasswordReset} className="space-y-6 max-w-md">
                                    <p className="text-sm text-gray-600 mb-2">Enter your account email address. We will send you a verification code to reset your password.</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input type="email" required value={resetData.email} onChange={(e) => setResetData({ ...resetData, email: e.target.value })} placeholder="user@example.com" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={isSaving || !resetData.email} className="bg-[#5B4DFF] hover:bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer w-full md:w-auto">
                                            {isSaving ? "Sending..." : "Send Reset Code"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleSubmitNewPassword} className="space-y-6 max-w-md">
                                    <p className="text-sm text-gray-600 mb-2">Check your email for the verification code and set your new password below.</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recovery Code</label>
                                        <input type="text" required value={resetData.code} onChange={(e) => setResetData({ ...resetData, code: e.target.value })} placeholder="123456" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                        <input type="password" required minLength={6} value={resetData.newPassword} onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} placeholder="••••••••" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all" />
                                    </div>
                                    <div className="pt-2 flex items-center gap-4">
                                        <button type="submit" disabled={isSaving || !resetData.code || !resetData.newPassword} className="bg-[#5B4DFF] hover:bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex-1">
                                            {isSaving ? "Updating..." : "Update Password"}
                                        </button>
                                        <button type="button" onClick={() => setResetStep(1)} className="py-3.5 px-6 font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === "danger" && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className="text-2xl font-bold mb-6 text-red-600 border-b border-red-100 pb-4">Danger Zone</h2>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-red-900 mb-2">Delete Account</h3>
                                <p className="text-red-700 mb-8 text-sm leading-relaxed">Are you sure you want to delete your account? This action is permanent and will remove all your data, campaign history, and settings. This cannot be undone.</p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isSaving}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? "Deleting..." : "Yes, Delete My Account"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}