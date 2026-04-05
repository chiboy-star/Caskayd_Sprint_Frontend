"use client";

import { useState, useEffect, useRef } from "react";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill";
import { CheckCircleIcon, XCircleIcon, KeyIcon, UserCircleIcon, TrashIcon, PlayCircleIcon, CloudArrowUpIcon, PhotoIcon, FilmIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface SpotlightVideo {
    position: number;
    provider: string;
    originalUrl: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
    customThumbnailUrl?: string | null;
    storedVideoUrl?: string | null;
}

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
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
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

    const [profileData, setProfileData] = useState({
        displayName: "", bio: "", location: "", 
        instagram: "", tiktok: "", pricePerPost: ""
    });

    const [spotlightVideos, setSpotlightVideos] = useState<SpotlightVideo[]>([]);
    const [isUpdatingSpotlight, setIsUpdatingSpotlight] = useState(false);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [resetStep, setResetStep] = useState<1 | 2>(1);
    const [resetData, setResetData] = useState({ email: "", code: "", newPassword: "" });

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });

    const fetchProfile = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            console.log("🔵 [API Request] GET /users/creator/profile");
            const res = await fetch(`${BASE_URL}/users/creator/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log("🟢 [API Response] GET /users/creator/profile SUCCESS:", data);
                
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
                    
                    setSpotlightVideos(profile.spotlightVideos || []);
                }
            } else {
                console.error("🔴 [API Error] GET /users/profile FAILED", await res.text());
            }
        } catch (error) {
            console.error("🔴 [Network Error] Failed to load profile:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

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

            console.log("🔵 [API Request] PATCH /users/creator/profile (General) PAYLOAD:", payload);
            const res = await fetch(`${BASE_URL}/users/creator/profile`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                console.log("🟢 [API Response] PATCH /users/creator/profile SUCCESS:", data);
                showToast("Profile updated successfully", "success");
            } else {
                const err = await res.json().catch(() => null);
                console.error("🔴 [API Error] PATCH /users/creator/profile FAILED:", err);
                showToast(err?.message || "Failed to update profile", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Profile update failed:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isUpdatingSpotlight) return; 
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isUpdatingSpotlight) return; 

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("video/")) {
            if (file.size > 50 * 1024 * 1024) return showToast("Video must be under 50MB", "error");
            setVideoFile(file);
        } else {
            showToast("Please drop a valid video file", "error");
        }
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return showToast("Thumbnail must be under 5MB", "error");
        
        setThumbnailFile(file);
        const previewUrl = URL.createObjectURL(file);
        setThumbnailPreview(previewUrl);
    };

    const handleAddSpotlightVideo = async () => {
        if (!videoFile) return showToast("Please select a video file", "error");
        
        // STRICT LIMIT: Only 1 video allowed
        if (spotlightVideos.length >= 1) return showToast("Maximum of 1 spotlight video allowed", "error");

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUpdatingSpotlight(true);
        let customThumbnailUrl = undefined;

        try {
            if (thumbnailFile) {
                const thumbFormData = new FormData();
                thumbFormData.append("file", thumbnailFile);

                console.log("🔵 [API Request] POST /users/creator/profile/spotlight/thumbnail PAYLOAD: FormData (Image)");
                const thumbRes = await fetch(`${BASE_URL}/users/creator/profile/spotlight/thumbnail`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: thumbFormData
                });

                if (thumbRes.ok) {
                    const thumbData = await thumbRes.json();
                    console.log("🟢 [API Response] POST .../thumbnail SUCCESS:", thumbData);
                    customThumbnailUrl = thumbData.url;
                } else {
                    const err = await thumbRes.json().catch(() => null);
                    console.error("🔴 [API Error] POST .../thumbnail FAILED:", err);
                    return showToast(err?.message || "Failed to upload thumbnail", "error");
                }
            }

            const videoFormData = new FormData();
            videoFormData.append("file", videoFile);
            if (customThumbnailUrl) {
                videoFormData.append("customThumbnailUrl", customThumbnailUrl);
            }

            console.log("🔵 [API Request] POST /users/creator/profile/spotlight/upload PAYLOAD: FormData (Video)");
            const videoRes = await fetch(`${BASE_URL}/users/creator/profile/spotlight/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: videoFormData
            });

            if (videoRes.ok) {
                const videoData = await videoRes.json();
                console.log("🟢 [API Response] POST .../upload SUCCESS:", videoData);
                showToast("Video uploaded and compressed successfully", "success");
                
                setVideoFile(null);
                setThumbnailFile(null);
                setThumbnailPreview(null);
                
                await fetchProfile(); 
            } else {
                const err = await videoRes.json().catch(() => null);
                console.error("🔴 [API Error] POST .../upload FAILED:", err);
                showToast(err?.message || "Failed to upload video", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Add spotlight failed:", error);
            showToast("Network error occurred during upload", "error");
        } finally {
            setIsUpdatingSpotlight(false);
        }
    };

    const handleDeleteSpotlightVideo = async (position: number) => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUpdatingSpotlight(true);
        try {
            console.log(`🔵 [API Request] DELETE /users/creator/profile/spotlight/${position}`);
            const res = await fetch(`${BASE_URL}/users/creator/profile/spotlight/${position}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log(`🟢 [API Response] DELETE /users/creator/profile/spotlight/${position} SUCCESS`);
                showToast("Video removed successfully", "success");
                await fetchProfile(); 
            } else {
                const err = await res.json().catch(() => null);
                console.error(`🔴 [API Error] DELETE /users/creator/profile/spotlight/${position} FAILED:`, err);
                showToast(err?.message || "Failed to remove video", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Delete spotlight failed:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsUpdatingSpotlight(false);
        }
    };

    const handleRequestPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.email) return showToast("Please enter your email", "error");

        setIsLoading(true);
        try {
            const payload = { email: resetData.email };
            console.log("🔵 [API Request] POST /auth/forgot-password PAYLOAD:", payload);
            const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log("🟢 [API Response] POST /auth/forgot-password SUCCESS");
                showToast("Reset code sent to your email!", "success");
                setResetStep(2); 
            } else {
                const data = await res.json().catch(() => ({}));
                console.error("🔴 [API Error] POST /auth/forgot-password FAILED:", data);
                showToast(data.message || "Failed to send reset email.", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Forgot password failed:", error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetData.code || !resetData.newPassword) return showToast("Please fill all fields", "error");

        setIsLoading(true);
        try {
            const payload = { email: resetData.email, code: resetData.code, newPassword: resetData.newPassword };
            console.log("🔵 [API Request] POST /auth/reset-password PAYLOAD:", payload);
            const res = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log("🟢 [API Response] POST /auth/reset-password SUCCESS");
                showToast("Password updated successfully!", "success");
                setResetStep(1);
                setResetData({ email: "", code: "", newPassword: "" });
            } else {
                const data = await res.json().catch(() => ({}));
                console.error("🔴 [API Error] POST /auth/reset-password FAILED:", data);
                showToast(data.message || "Failed to update password.", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Reset password failed:", error);
            showToast("Network error. Please try again.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
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
                localStorage.removeItem("accessToken");
                window.location.href = "/creator/login";
            } else {
                const err = await res.json().catch(() => ({}));
                console.error("🔴 [API Error] DELETE /users/account FAILED:", err);
                showToast(err?.message || "Failed to delete account", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] Account deletion failed:", error);
            showToast("Network error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-[#F8F9FB] flex flex-col ${inter.className}`}>
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />
            <CreatorNavigationPill />

            <main className="flex-1 w-full max-w-[90rem] mx-auto px-4 md:px-8 pb-20 pt-[140px] md:pt-[160px] flex flex-col md:flex-row gap-8 items-start">
                
                <h1 className="sr-only">Creator Account Settings</h1>

                <div className="w-full md:w-64 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 px-4 pt-2">Settings</h2>
                    
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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

                <div className="flex-1 w-full max-w-3xl bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 min-h-[500px]">
                    
                    {activeTab === "profile" && (
                        <div className="animate-in fade-in duration-300">
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
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

                                <div className="pt-2">
                                    <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer">
                                        {isLoading ? "Saving..." : "Save Profile Details"}
                                    </button>
                                </div>
                            </form>

                            {/* --- PORTFOLIO SPOTLIGHT SECTION --- */}
                            <div className="mt-12 pt-10 border-t border-gray-100">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Portfolio Spotlight</h2>
                                    {/* Copy updated to reflect the new 1 video limit */}
                                    <p className="text-sm text-gray-500 mt-1">Upload 1 video (Max 50MB) directly to your profile to showcase your best work.</p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {spotlightVideos.map((video) => (
                                        // The flex-1 and min-w-0 classes here prevent long URLs from pushing the trash icon out of bounds
                                        <div key={video.position} className="flex items-center justify-between gap-4 p-4 border border-gray-200 bg-white rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="relative w-20 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                                    {video.customThumbnailUrl || video.thumbnailUrl ? (
                                                        <img src={video.customThumbnailUrl || video.thumbnailUrl || ''} alt="Thumbnail" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <PlayCircleIcon className="w-8 h-8 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 capitalize truncate">{video.provider}</p>
                                                    <p className="text-xs text-gray-500 truncate">{video.storedVideoUrl || "Video File"}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteSpotlightVideo(video.position)}
                                                disabled={isUpdatingSpotlight}
                                                className="shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {spotlightVideos.length === 0 && (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-gray-500">No spotlight video added yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Only show the upload form if they have 0 videos */}
                                {spotlightVideos.length === 0 && (
                                    <div className={`bg-[#F8F9FB] border border-dashed rounded-3xl p-6 transition-all duration-300 ${isUpdatingSpotlight ? "opacity-50 border-gray-200" : "border-gray-300"}`}>
                                        
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div 
                                                className={`flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all ${
                                                    isUpdatingSpotlight 
                                                    ? "bg-gray-50 border-gray-200 cursor-not-allowed" 
                                                    : isDragging 
                                                    ? "border-emerald-500 bg-emerald-50 cursor-pointer" 
                                                    : "bg-white border-gray-200 hover:border-emerald-300 cursor-pointer"
                                                }`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => !isUpdatingSpotlight && videoInputRef.current?.click()}
                                            >
                                                <CloudArrowUpIcon className={`w-10 h-10 mb-3 ${isDragging && !isUpdatingSpotlight ? "text-emerald-500" : "text-gray-400"}`} />
                                                <p className="text-sm font-bold text-gray-700 text-center mb-1 truncate max-w-full px-2">
                                                    {videoFile ? videoFile.name : "Drag & Drop Video Here"}
                                                </p>
                                                <p className="text-xs text-gray-500 text-center">MP4, MOV, WEBM up to 50MB</p>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    ref={videoInputRef} 
                                                    accept="video/mp4,video/quicktime,video/webm" 
                                                    disabled={isUpdatingSpotlight}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && file.size <= 50 * 1024 * 1024) setVideoFile(file);
                                                        else if (file) showToast("Video must be under 50MB", "error");
                                                    }}
                                                />
                                            </div>

                                            <div className="w-full md:w-48 flex flex-col shrink-0 gap-3">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Custom Cover (Opt)</label>
                                                <div 
                                                    onClick={() => !isUpdatingSpotlight && thumbnailInputRef.current?.click()}
                                                    className={`relative aspect-video w-full bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden transition-colors group ${
                                                        isUpdatingSpotlight ? "cursor-not-allowed bg-gray-50" : "cursor-pointer hover:border-emerald-300"
                                                    }`}
                                                >
                                                    {thumbnailPreview ? (
                                                        <>
                                                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                                            {!isUpdatingSpotlight && (
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <span className="text-white text-xs font-bold">Change</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className={`flex flex-col items-center transition-colors ${isUpdatingSpotlight ? "text-gray-300" : "text-gray-400 group-hover:text-emerald-500"}`}>
                                                            <PhotoIcon className="w-6 h-6 mb-1" />
                                                            <span className="text-[10px] font-semibold uppercase">Upload JPG/PNG</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        ref={thumbnailInputRef} 
                                                        accept="image/jpeg,image/png,image/webp" 
                                                        disabled={isUpdatingSpotlight} 
                                                        onChange={handleThumbnailSelect}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={handleAddSpotlightVideo}
                                                disabled={isUpdatingSpotlight || !videoFile}
                                                className="bg-black hover:bg-gray-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                                            >
                                                <FilmIcon className="w-5 h-5" />
                                                {isUpdatingSpotlight ? "Uploading..." : "Upload Spotlight"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                        <input type="email" required value={resetData.email} onChange={(e) => setResetData({ ...resetData, email: e.target.value })} placeholder="user@example.com" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all" />
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={isLoading || !resetData.email} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer w-full md:w-auto">
                                            {isLoading ? "Sending..." : "Send Reset Code"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleSubmitNewPassword} className="space-y-6 max-w-md">
                                    <p className="text-sm text-gray-600 mb-2">Check your email for the verification code and set your new password below.</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recovery Code</label>
                                        <input type="text" required value={resetData.code} onChange={(e) => setResetData({ ...resetData, code: e.target.value })} placeholder="123456" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                        <input type="password" required minLength={6} value={resetData.newPassword} onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} placeholder="••••••••" className="w-full bg-[#F8F9FB] border border-gray-200 rounded-xl py-3.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all" />
                                    </div>
                                    <div className="pt-2 flex items-center gap-4">
                                        <button type="submit" disabled={isLoading || !resetData.code || !resetData.newPassword} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex-1">
                                            {isLoading ? "Updating..." : "Update Password"}
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