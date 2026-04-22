"use client";

import { useState, useRef, useEffect } from "react";
import { CloudArrowUpIcon, PhotoIcon, FilmIcon, XMarkIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// simple local toast for the modal
const ModalToast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 4000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

interface SpotlightPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // call this to refresh dashboard data after upload
}

export default function SpotlightPromptModal({ isOpen, onClose, onSuccess }: SpotlightPromptModalProps) {
    const [isUpdatingSpotlight, setIsUpdatingSpotlight] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });

    const videoInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });

    // reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setVideoFile(null);
            setThumbnailFile(null);
            setThumbnailPreview(null);
            setIsUpdatingSpotlight(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUpdatingSpotlight(true);
        let customThumbnailUrl = undefined;

        try {
            // upload thumbnail first if it exists
            if (thumbnailFile) {
                const thumbFormData = new FormData();
                thumbFormData.append("file", thumbnailFile);

                const thumbRes = await fetch(`${BASE_URL}/users/creator/profile/spotlight/thumbnail`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: thumbFormData
                });

                if (thumbRes.ok) {
                    const thumbData = await thumbRes.json();
                    customThumbnailUrl = thumbData.url;
                } else {
                    const err = await thumbRes.json().catch(() => null);
                    return showToast(err?.message || "Failed to upload thumbnail", "error");
                }
            }

            // upload the video
            const videoFormData = new FormData();
            videoFormData.append("file", videoFile);
            if (customThumbnailUrl) {
                videoFormData.append("customThumbnailUrl", customThumbnailUrl);
            }

            const videoRes = await fetch(`${BASE_URL}/users/creator/profile/spotlight/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: videoFormData
            });

            if (videoRes.ok) {
                showToast("Video uploaded successfully!", "success");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                const err = await videoRes.json().catch(() => null);
                showToast(err?.message || "Failed to upload video", "error");
            }
        } catch (error) {
            showToast("Network error occurred during upload", "error");
        } finally {
            setIsUpdatingSpotlight(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm">
            {/* slide up animation container */}
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
                
                <ModalToast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />

                <button 
                    aria-label="Close modal" 
                    onClick={onClose} 
                    disabled={isUpdatingSpotlight}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer disabled:opacity-50"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="mb-6 mt-2">
                    <h2 className="text-2xl font-bold text-gray-900">Stand Out to Brands! ✨</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Creators with a spotlight video get hired much faster. Upload a quick introduction or a reel showing your best work.
                    </p>
                </div>

                <div className={`bg-[#F8F9FB] border border-dashed rounded-3xl p-6 transition-all duration-300 ${isUpdatingSpotlight ? "opacity-50 border-gray-200" : "border-gray-300"}`}>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* video dropzone */}
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

                        {/* thumbnail picker */}
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

                    <div className="mt-6 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            disabled={isUpdatingSpotlight}
                            className="text-gray-500 hover:text-gray-800 font-bold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Skip for now
                        </button>
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
            </div>
        </div>
    );
}