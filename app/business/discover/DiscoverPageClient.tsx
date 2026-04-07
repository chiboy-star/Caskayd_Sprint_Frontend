"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { 
    MagnifyingGlassIcon, 
    ChevronDownIcon, 
    XMarkIcon, 
    CheckCircleIcon,
    ExclamationCircleIcon,
    AdjustmentsHorizontalIcon,
    MapPinIcon,
    ArrowTopRightOnSquareIcon,
    PaperAirplaneIcon,
    PlayCircleIcon
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon, PlayIcon } from "@heroicons/react/24/solid"; 
import NavigationPill from "@/components/NavigationPill"; 

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type FilterOption = string | { label: string; value: string };

interface SpotlightVideo {
    position: number;
    provider: string;
    originalUrl: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
    customThumbnailUrl?: string | null;
    storedVideoUrl?: string | null;
}

interface CreatorProfile {
    id?: string;
    userId?: string;
    profileId?: string; 
    displayName?: string | null; 
    profileImageUrl?: string | null;
    instagram?: string;
    tiktok?: string;
    links?: {
        instagram?: string;
        tiktok?: string;
    };
    bio?: string;
    niches?: string[];
    instagramFollowers?: number;
    tiktokFollowers?: number;
    instagramEngagementRate?: number;
    tiktokEngagementRate?: number;
    pricePerPost?: number | string;
    location?: string;
    spotlightVideos?: SpotlightVideo[];
}

const AVAILABLE_NICHES = [
    "Food & Food Stuff", "Beverages", "Electronics/Gadgets", "Flowers & Floral-inspired Gifts",
    "Gifts & Gift packages", "Arts & Crafts", "Retail (General)", "Clothing", 
    "Jewelry & Accessories", "Footwear", "Extensions", "Bags", "Perfumes", 
    "Skincare", "Transportation / Travel", "Hospitality Services", "Product Customization"
];

const FILTER_OPTIONS = {
  price: [
      { label: "Under ₦50k", value: "50000" },
      { label: "Under ₦100k", value: "100000" },
      { label: "Under ₦500k", value: "500000" },
      { label: "₦500k+", value: "500001" }
  ],
  platform: ["instagram", "tiktok"]
};

const PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60"
];

const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    // Fix 1: Boosted z-index to 9999 so it shows over modals
    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-6 h-6"/> : <ExclamationCircleIcon className="w-6 h-6"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ overflow: 'visible', filter: 'drop-shadow(1.5px 1.5px 0px #fe0050) drop-shadow(-1.5px -1.5px 0px #00f2fe)' }}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.89-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-.54-2.49.42-5.18 2.45-6.83 1.98-1.63 4.81-1.82 7.01-.52.14.09.28.19.42.29-.01 1.33-.01 2.66-.01 4-.08-.03-.17-.07-.25-.11-.95-.49-2.05-.64-3.11-.42-1.18.24-2.19 1.05-2.67 2.17-.5 1.17-.37 2.54.34 3.59.83 1.25 2.51 1.74 3.94 1.13.92-.38 1.63-1.16 1.93-2.1.26-.81.25-1.68.25-2.53-.02-5.24-.02-10.49-.02-15.73z" />
  </svg>
);

const FilterDropdown = ({ label, options, onSelect }: { label: string, options: FilterOption[], onSelect: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-transparent text-sm font-semibold transition-all whitespace-nowrap ${isOpen ? 'text-black' : 'text-gray-500 hover:text-black cursor-pointer'}`}
            >
                {label}
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2 max-h-60 overflow-y-auto">
                        {options.map((option, idx) => {
                            const displayLabel = typeof option === 'object' ? option.label : option;
                            const returnValue = typeof option === 'object' ? option.value : option;
                            return (
                                <button 
                                    key={idx} 
                                    className="w-full text-left px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                                    onClick={() => { onSelect(returnValue); setIsOpen(false); }}
                                >
                                    {displayLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MultiSelectDropdown = ({ label, options, selectedValues, onToggle }: { label: string, options: string[], selectedValues: string[], onToggle: (val: string[]) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (option: string) => {
        if (selectedValues.includes(option)) {
            onToggle(selectedValues.filter(v => v !== option));
        } else {
            onToggle([...selectedValues, option]);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-transparent text-sm font-semibold transition-all whitespace-nowrap ${isOpen || selectedValues.length > 0 ? 'text-black' : 'text-gray-500 hover:text-black cursor-pointer'}`}
            >
                {selectedValues.length > 0 ? `${selectedValues.length} Selected` : label}
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {options.map((option, idx) => {
                            const isSelected = selectedValues.includes(option);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handleToggle(option)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-medium transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${isSelected ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                                        {isSelected && <CheckCircleIcon className="w-3 h-3" />}
                                    </div>
                                    <span className="flex-1 text-left">{option}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const VideoPlayerModal = ({ video, onClose }: { video: SpotlightVideo | null, onClose: () => void }) => {
    if (!video) return null;

    const isUpload = video.provider === 'upload' && video.storedVideoUrl;
    const isTikTok = video.embedUrl?.includes('tiktok.com');

    return (
        <div onClick={onClose} className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:text-gray-300 cursor-pointer z-10 p-2 bg-black/50 rounded-full">
                <XMarkIcon className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            
            <div onClick={e => e.stopPropagation()} className={`w-full bg-black rounded-xl overflow-hidden shadow-2xl relative ${isTikTok ? 'max-w-sm aspect-[9/16]' : 'max-w-5xl aspect-video'}`}>
                {isUpload ? (
                    <video 
                        src={video.storedVideoUrl!} 
                        controls 
                        autoPlay 
                        className="w-full h-full object-contain"
                    />
                ) : video.embedUrl ? (
                    <iframe 
                        src={video.embedUrl} 
                        className="w-full h-full border-0" 
                        allowFullScreen 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">Video unavailable</div>
                )}
            </div>
        </div>
    );
}

const CreatorDetailsModal = ({ isOpen, onClose, creator, onInvite, onPlayVideo }: { isOpen: boolean, onClose: () => void, creator: CreatorProfile | null, onInvite: (c: CreatorProfile) => void, onPlayVideo: (video: SpotlightVideo) => void }) => {
    if (!isOpen || !creator) return null;

    const igLink = creator.links?.instagram || creator.instagram;
    const tkLink = creator.links?.tiktok || creator.tiktok;

    const handleSocialClick = (url?: string) => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    const initial = (creator.displayName || "C").charAt(0).toUpperCase();
    const price = creator.pricePerPost ? `₦${Number(creator.pricePerPost).toLocaleString()}` : "N/A";
    const placeholderImg = PLACEHOLDERS[0]; 

    const renderSpotlightCards = () => {
        if (!creator.spotlightVideos || creator.spotlightVideos.length === 0) return null;

        return (
            <div className="mb-10">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Spotlight Work</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {creator.spotlightVideos.map((video) => {
                        const thumb = video.customThumbnailUrl || video.thumbnailUrl || placeholderImg;
                        const isIG = video.provider === 'instagram';
                        const isUpload = video.provider === 'upload';

                        return (
                            <div 
                                key={video.position} 
                                onClick={() => {
                                    if (isUpload || video.embedUrl) {
                                        onPlayVideo(video);
                                    } else if (video.originalUrl) {
                                        window.open(video.originalUrl, '_blank');
                                    }
                                }}
                                className="group relative aspect-video bg-gray-100 rounded-2xl overflow-hidden cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all"
                            >
                                <Image src={thumb} alt="Spotlight" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                    {isIG ? <ArrowTopRightOnSquareIcon className="w-10 h-10 text-white drop-shadow-md" /> : <PlayIcon className="w-12 h-12 text-white drop-shadow-md" />}
                                </div>

                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                    {isIG ? <InstagramIcon className="w-4 h-4 text-white" /> : (video.provider === 'tiktok' ? <TiktokIcon className="w-4 h-4 text-white" /> : <PlayCircleIcon className="w-4 h-4 text-white" />)}
                                    <span className="text-white text-xs font-bold capitalize drop-shadow-md">{video.provider}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    return (
        <div onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md md:max-w-4xl bg-[#0A0A0A]/90 md:bg-white backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-white md:text-slate-900 border border-white/10 md:border-none overflow-y-auto max-h-[90vh] md:flex md:p-10 md:gap-10">
                
                <button onClick={onClose} className="absolute top-6 right-6 md:top-8 md:right-8 text-gray-400 hover:text-white md:hover:text-black transition-colors cursor-pointer z-10 p-2 md:bg-gray-100 md:rounded-full">
                    <XMarkIcon className="w-6 h-6 md:w-5 md:h-5" />
                </button>

                {/* --- MOBILE VIEW --- */}
                <div className="flex flex-col items-center mt-2 text-center md:hidden w-full">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 relative mb-4 border-2 border-white/10 shrink-0">
                        {creator.profileImageUrl ? (
                            <Image src={creator.profileImageUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{initial}</div>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-1">{creator.displayName || "Unknown Creator"}</h2>
                    
                    {creator.location && (
                        <p className="text-gray-400 text-sm mb-4 flex items-center gap-1 justify-center">
                            <MapPinIcon className="w-4 h-4"/> {creator.location}
                        </p>
                    )}

                    {creator.bio && (
                        <p className="text-sm text-gray-300 mb-6 italic px-4">&quot;{creator.bio}&quot;</p>
                    )}

                    {creator.niches && creator.niches.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {creator.niches.map((n, i) => (
                                <span key={i} className="bg-white/10 border border-white/5 text-xs font-semibold px-3 py-1 rounded-full text-gray-200 capitalize">
                                    {n}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full mb-6">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-left">
                            <div className="flex items-center gap-2 mb-2 text-gray-400"><InstagramIcon className="w-4 h-4"/> Instagram</div>
                            <p className="text-sm font-bold">{formatNumber(creator.instagramFollowers)} <span className="text-xs font-normal text-gray-500">Followers</span></p>
                            <p className="text-sm font-bold mt-1">{creator.instagramEngagementRate || 0}% <span className="text-xs font-normal text-gray-500">Eng. Rate</span></p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-left">
                            <div className="flex items-center gap-2 mb-2 text-gray-400"><TiktokIcon className="w-4 h-4"/> TikTok</div>
                            <p className="text-sm font-bold">{formatNumber(creator.tiktokFollowers)} <span className="text-xs font-normal text-gray-500">Followers</span></p>
                            <p className="text-sm font-bold mt-1">{creator.tiktokEngagementRate || 0}% <span className="text-xs font-normal text-gray-500">Eng. Rate</span></p>
                        </div>
                    </div>

                    <div className="w-full text-left">
                        {renderSpotlightCards()}
                    </div>

                    <div className="flex w-full gap-3 mb-6">
                        <button 
                            onClick={() => handleSocialClick(igLink)} 
                            disabled={!igLink} 
                            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            <InstagramIcon className="w-5 h-5"/> View IG
                        </button>
                        <button 
                            onClick={() => handleSocialClick(tkLink)} 
                            disabled={!tkLink} 
                            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed bg-black border border-gray-700 hover:bg-gray-900 text-white transition-colors cursor-pointer"
                        >
                            <TiktokIcon className="w-5 h-5"/> View TikTok
                        </button>
                    </div>

                    <button 
                        onClick={() => { onClose(); onInvite(creator); }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-colors shadow-lg active:scale-95 cursor-pointer"
                    >
                        Send Invite Request
                    </button>
                </div>

                {/* --- DESKTOP VIEW --- */}
                <div className="hidden md:flex w-full items-stretch gap-10 lg:gap-12">
                    <div className="w-[45%] relative rounded-[2rem] overflow-hidden bg-gray-100 shrink-0 shadow-inner min-h-[450px]">
                        {creator.profileImageUrl ? (
                            <Image 
                                src={creator.profileImageUrl} 
                                alt={creator.displayName || "Creator"} 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                            <Image 
                                src={placeholderImg} 
                                alt={creator.displayName || "Creator"} 
                                fill 
                                className="object-cover"
                            />
                        )}
                    </div>

                    <div className="flex-1 flex flex-col py-2">
                        <div className="mb-8 pr-12 relative">
                            <div className="flex items-start gap-3 mb-1">
                                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight break-words line-clamp-2">{creator.displayName || "Unknown Creator"}</h2>
                                <CheckBadgeIcon className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Bio</h3>
                            <p className="text-gray-600 leading-relaxed text-[15px]">
                                {creator.bio ? creator.bio : "No bio provided."}
                            </p>
                        </div>

                        {creator.niches && creator.niches.length > 0 && (
                            <div className="mb-8">
                                <div className="flex flex-wrap gap-2">
                                    {creator.niches.map((n, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-700 font-semibold px-4 py-1.5 rounded-full text-sm capitalize">
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-10 flex items-baseline gap-2">
                            <span className="text-lg text-gray-500 font-medium">Base Rate:</span>
                            <span className="text-3xl font-extrabold text-slate-900">{price}</span>
                        </div>

                        {renderSpotlightCards()}

                        <div className="flex flex-col gap-4 mt-auto">
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => handleSocialClick(igLink)} 
                                    disabled={!igLink} 
                                    className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:shadow-lg hover:shadow-pink-200/50 transition-all cursor-pointer"
                                >
                                    <InstagramIcon className="w-5 h-5" /> Instagram
                                </button>
                                
                                <button 
                                    onClick={() => handleSocialClick(tkLink)} 
                                    disabled={!tkLink} 
                                    className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed bg-black hover:bg-gray-800 text-white shadow-md transition-colors cursor-pointer"
                                >
                                    <TiktokIcon className="w-5 h-5" /> TikTok
                                </button>
                            </div>

                            <button 
                                onClick={() => { onClose(); onInvite(creator); }}
                                className="w-full bg-white hover:bg-gray-50 text-slate-900 font-extrabold py-4 rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-lg mt-3 border-2 border-gray-100 shadow-sm"
                            >
                                Send Request +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InviteModal = ({ 
    isOpen, 
    onClose, 
    creator, 
    onShowToast 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    creator: CreatorProfile | null, 
    onShowToast: (msg: string, type: "success" | "error") => void 
}) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        startDate: "",
        endDate: "",
        budget: ""
    });

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({ description: "", startDate: "", endDate: "", budget: "" });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (!formData.startDate || !formData.endDate) {
            onShowToast("Please select campaign dates.", "error");
            return;
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!formData.budget || !formData.description) {
            onShowToast("Please provide a budget and description.", "error");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("accessToken");
            const payload = {
                creatorId: creator?.userId,
                message: formData.description,
                proposedPrice: Number(formData.budget),
                startDate: formData.startDate,
                endDate: formData.endDate,
                briefUrl: "https://caskayd.com/brief-template.pdf"
            };

            
            const res = await fetch(`${BASE_URL}/chat-requests`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                
                
                if (res.status === 400) {
                    onShowToast("You already have an active conversation with this creator.", "error");
                    setIsSubmitting(false);
                    return; 
                }

                throw new Error("Failed to send collaboration request");
            }

            
            onShowToast("Request Sent Successfully!", "success");
            onClose();
        } catch (error: any) {
            
            onShowToast(error.message || "Something went wrong.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !creator) return null;

    return (
        <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-slate-900">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-4">
                        <PaperAirplaneIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Collaborate with {creator.displayName}</h2>
                    <p className="text-sm text-gray-500 mt-1">Step {step} of 2</p>
                </div>

                {step === 1 ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Start Date</label>
                                <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full bg-gray-50 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none border border-gray-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">End Date</label>
                                <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full bg-gray-50 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none border border-gray-100" />
                            </div>
                        </div>
                        <button onClick={handleNext} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer">Next Step</button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proposed Budget</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                <input type="number" placeholder="0.00" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full bg-gray-50 rounded-xl py-4 pl-10 pr-4 text-xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none border border-gray-100" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Collaboration Note</label>
                            <textarea rows={3} placeholder="Briefly describe what you need..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none border border-gray-100 resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors cursor-pointer">Back</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                                {isSubmitting ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CreatorCard = ({ creator, onViewDetails, onInvite, index }: { creator: CreatorProfile, onViewDetails: (c: CreatorProfile) => void, onInvite: (c: CreatorProfile) => void, index: number }) => {
    const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");

    const placeholderImg = PLACEHOLDERS[index % PLACEHOLDERS.length];

    const togglePlatform = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setPlatform(prev => prev === "instagram" ? "tiktok" : "instagram");
    };

    const handleUrl = platform === "instagram" 
        ? (creator.links?.instagram || creator.instagram) 
        : (creator.links?.tiktok || creator.tiktok);

    const followers = platform === "instagram" ? creator.instagramFollowers : creator.tiktokFollowers;
    const engagement = platform === "instagram" ? creator.instagramEngagementRate : creator.tiktokEngagementRate;

    const getHandle = () => {
        if (!handleUrl) return "Unknown Creator";
        let clean = handleUrl.replace(/(^\w+:|^)\/\//, '').replace("www.", "");
        clean = clean.replace("instagram.com/", "").replace("tiktok.com/", "").replace("@", "");
        if(clean.endsWith("/")) clean = clean.slice(0, -1);
        return clean.length > 20 ? `${clean.substring(0, 20)}...` : clean; 
    };

    const displayName = creator.displayName || getHandle();
    const price = creator.pricePerPost ? `₦${Number(creator.pricePerPost).toLocaleString()}` : "N/A";
    const location = creator.location || "Unknown";

    return (
        <div 
            onClick={() => onViewDetails(creator)}
            className="bg-white rounded-4xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-transparent hover:border-gray-100 cursor-pointer"
        >
            <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-gray-100 mb-4">
                <Image 
                    src={creator.profileImageUrl || placeholderImg} 
                    alt={displayName} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>
            
            <div className="flex flex-col gap-3 flex-1 px-1">
                <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-lg text-slate-900 truncate">{displayName}</h3>
                    <CheckBadgeIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                </div>

                <div className="flex flex-col gap-1.5 pb-1">
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                        <span className="text-gray-400 mr-1">Followers:</span>
                        <span className="text-slate-900 font-bold">{formatNumber(followers)}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-400 mr-1">Price:</span>
                        <span className="text-slate-900 font-bold">{price}</span>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 font-medium">
                        <span className="text-gray-400 mr-1">Loc:</span>
                        <span className="text-slate-900 font-bold truncate max-w-20">{location}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-400 mr-1">Eng Rate:</span>
                        <span className="text-slate-900 font-bold">{engagement ? Number(engagement).toFixed(1) : "0"}%</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-1 gap-3">
                    <button 
                        onClick={togglePlatform}
                        className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                            platform === 'instagram' 
                            ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:shadow-pink-200' 
                            : 'bg-black hover:shadow-gray-300'
                        }`}
                    >
                        {platform === 'instagram' ? <InstagramIcon className="w-4 h-4" /> : <TiktokIcon className="w-4 h-4" />}
                    </button>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onInvite(creator); }}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-full transition-colors text-center text-xs active:scale-95 cursor-pointer"
                    >
                        Send Request +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function DiscoverPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedInviteCreator, setSelectedInviteCreator] = useState<CreatorProfile | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetailsCreator, setSelectedDetailsCreator] = useState<CreatorProfile | null>(null);
  const [toast, setToast] = useState<{msg: string, type: "success"|"error", visible: boolean}>({ msg: "", type: "success", visible: false });

  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ niche: [] as string[], price: "", platform: "" });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isSearchScrolledPast, setIsSearchScrolledPast] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  const [showFloatingFilterModal, setShowFloatingFilterModal] = useState(false);

  const [playingVideo, setPlayingVideo] = useState<SpotlightVideo | null>(null);

  const showToast = (msg: string, type: "success"|"error") => {
      setToast({ msg, type, visible: true });
  };

  useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
          setIsSearchScrolledPast(!entry.isIntersecting);
      }, { threshold: 0 });

      if (searchContainerRef.current) {
          observer.observe(searchContainerRef.current);
      }

      return () => observer.disconnect();
  }, []);

  useEffect(() => {
      const fetchCreators = async () => {
          setLoading(true);
          try {
              const params = new URLSearchParams();
              if (filters.niche.length > 0) params.append("niche", filters.niche.join(",").toLowerCase());
              
              const url = `${BASE_URL}/creator${params.toString() ? `?${params.toString()}` : ''}`;
              
             
              const res = await fetch(url, {
                  headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
              });
                
              if (res.ok) {
                  const data = await res.json();
                  
                  setCreators(data); 
              } else {
                  
              }
          } catch (error) {
              
          } finally {
              setLoading(false);
          }
      };

      const timeoutId = setTimeout(() => {
          fetchCreators();
      }, 500); 

      return () => clearTimeout(timeoutId);
  }, [filters.niche]); 

  const handleFilterSelect = (type: string, value: string | string[]) => {
      setFilters(prev => ({ ...prev, [type]: value }));
  };

  const openInviteModal = (creator: CreatorProfile) => {
      setSelectedInviteCreator(creator);
      setIsInviteModalOpen(true);
  };

  const openDetailsModal = (creator: CreatorProfile) => {
      setSelectedDetailsCreator(creator);
      setIsDetailsModalOpen(true);
  };

  const displayedCreators = creators.filter((creator) => {
      let matchesSearch = true;
      if (searchQuery) {
          const normalize = (str: string) => (str || "").toLowerCase().replace(/[@_\-\s]/g, "");
          const query = normalize(searchQuery);

          const name = normalize(creator.displayName || "");
          const extractHandle = (url: string) => {
              if (!url) return "";
              let clean = url.replace(/(^\w+:|^)\/\//, '').replace("www.", "");
              clean = clean.replace("instagram.com/", "").replace("tiktok.com/", "").replace(/\/$/, '');
              return normalize(clean);
          };

          const igHandle = extractHandle(creator.links?.instagram || creator.instagram || "");
          const tkHandle = extractHandle(creator.links?.tiktok || creator.tiktok || "");

          matchesSearch = name.includes(query) || igHandle.includes(query) || tkHandle.includes(query);
      }

      let matchesPrice = true;
      if (filters.price) {
          const priceVal = Number(filters.price);
          const creatorPrice = Number(creator.pricePerPost) || 0;
          if (priceVal === 500001) { 
              matchesPrice = creatorPrice >= 500000;
          } else { 
              matchesPrice = creatorPrice <= priceVal;
          }
      }

      let matchesNiche = true;
      if (filters.niche.length > 0) {
          const creatorNichesLower = (creator.niches || []).map(n => n.toLowerCase());
          matchesNiche = filters.niche.some(selected => creatorNichesLower.includes(selected.toLowerCase()));
      }

      return matchesSearch && matchesPrice && matchesNiche;
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Discover Content Creators | Caskayd",
    "description": "Browse and filter top content creators on Caskayd by niche, price, and platform.",
    "url": "https://www.caskayd.com/business/discover"
  };

  return (
    <div className={`flex flex-col min-h-screen bg-[#F8F9FB] ${inter.className} overflow-x-hidden relative`}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />

      <VideoPlayerModal video={playingVideo} onClose={() => setPlayingVideo(null)} />

      {showFloatingFilterModal && (
        <div onClick={() => setShowFloatingFilterModal(false)} className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-32 animate-in fade-in duration-200">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                    <h3 className="font-bold text-lg">Filters</h3>
                    <button onClick={() => setShowFloatingFilterModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <div className="flex flex-col gap-4">
                    <MultiSelectDropdown label={filters.niche.length > 0 ? "Niches Selected" : "Select Niches"} options={AVAILABLE_NICHES} selectedValues={filters.niche} onToggle={(val) => handleFilterSelect("niche", val)} />
                    <FilterDropdown label="Price Range" options={FILTER_OPTIONS.price} onSelect={(val) => handleFilterSelect("price", val)} />   
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button onClick={() => setFilters({ niche: [], price: "", platform: "" })} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">Clear</button>
                    <button onClick={() => setShowFloatingFilterModal(false)} className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors cursor-pointer">Apply</button>
                </div>
            </div>
        </div>
      )}

      {isSearchScrolledPast && (
          <div className="fixed top-[130px] md:top-[140px] right-4 md:right-8 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFloatingSearch ? 'w-48 md:w-64 opacity-100 mr-1' : 'w-0 opacity-0 mr-0'}`}>
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search creators..." 
                      className="w-full bg-white rounded-full py-2.5 px-4 shadow-lg border border-gray-100 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100" 
                  />
              </div>

              <button 
                  onClick={() => setShowFloatingSearch(!showFloatingSearch)}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer text-gray-700"
              >
                  {showFloatingSearch ? <XMarkIcon className="w-5 h-5" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
              </button>

              <button 
                  onClick={() => setShowFloatingFilterModal(true)}
                  className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors cursor-pointer relative"
              >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  {(filters.niche.length > 0 || filters.price) && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black"></span>
                  )}
              </button>
          </div>
      )}

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        creator={selectedInviteCreator} 
        onShowToast={showToast}
      />

      <CreatorDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        creator={selectedDetailsCreator}
        onInvite={openInviteModal}
        onPlayVideo={setPlayingVideo}
      />

      <NavigationPill />

      <main className="w-full flex-1 pb-32 pt-[160px] md:pt-[180px]">
        <h1 className="sr-only">Discover Top Content Creators</h1>

        <div className="px-4 md:px-8" ref={searchContainerRef}>
            <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
                <div className="w-full max-w-lg relative group">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search creators by name or handle..." 
                        className="w-full bg-white rounded-full py-4 pl-8 pr-4 shadow-sm border border-gray-100 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-shadow" 
                    />
                </div>

                <div className="flex flex-wrap justify-center items-center gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                        <AdjustmentsHorizontalIcon className="w-7 h-7 text-white" />
                        Filter
                    </button>

                    {showFilters && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="bg-white rounded-full px-2 py-1 shadow-sm border border-gray-100 flex items-center">
                                <MultiSelectDropdown label={filters.niche.length > 0 ? "Niches" : "Select Niches"} options={AVAILABLE_NICHES} selectedValues={filters.niche} onToggle={(val) => handleFilterSelect("niche", val)} />
                                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                <FilterDropdown label="Price" options={FILTER_OPTIONS.price} onSelect={(val) => handleFilterSelect("price", val)} />   
                            </div>
                            
                            {(filters.niche.length > 0 || filters.price || filters.platform) && (
                                <button aria-label="reset fliters" onClick={() => setFilters({ niche: [], price: "", platform: "" })} className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="px-4 md:px-8 mt-16">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-4xl p-4 shadow-sm flex flex-col h-[400px] border border-gray-100 animate-pulse">
                                <div className="relative aspect-[4/5] w-full rounded-3xl bg-gray-200 mb-4 flex-shrink-0"></div>
                                <div className="flex flex-col gap-3 flex-1 px-1">
                                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    <div className="flex gap-3 mt-auto pt-1">
                                        <div className="w-[52px] h-[40px] rounded-full bg-gray-200 shrink-0"></div>
                                        <div className="flex-1 h-[40px] rounded-full bg-gray-200"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayedCreators.length > 0 ? ( 
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedCreators.map((creator: CreatorProfile, idx: number) => (
                            <CreatorCard 
                                key={creator.id || Math.random()} 
                                creator={creator} 
                                onViewDetails={openDetailsModal}
                                onInvite={openInviteModal} 
                                index={idx} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-gray-500">No creators found</p>
                        <p className="text-sm">Try adjusting your filters or search term</p>
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}