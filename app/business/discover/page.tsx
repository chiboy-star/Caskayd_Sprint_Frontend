"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid"; 
import NavigationPill from "@/components/NavigationPill"; 

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- TYPES ---
type FilterOption = string | { label: string; value: string };

interface CreatorProfile {
    id?: string;
    userId?: string;
    profileId?: string; 
    displayName?: string | null; 
    profileImageUrl?: string;
    instagram?: string;
    tiktok?: string;
    instagramFollowers?: number;
    tiktokFollowers?: number;
    instagramEngagementRate?: number;
    tiktokEngagementRate?: number;
    pricePerPost?: number | string;
    location?: string;
}

// --- CONFIGURATION ---
const FILTER_OPTIONS = {
  niche: ["fitness", "education", "fashion", "beauty", "tech", 
  "lifestyle", "business", "travel", "food", "entertainment"],
  price: [
      { label: "Under ₦50k", value: "50000" },
      { label: "Under ₦100k", value: "100000" },
      { label: "Under ₦500k", value: "500000" },
      { label: "₦500k+", value: "500001" }
  ],
  platform: ["instagram", "tiktok"]
};

// --- PLACEHOLDER IMAGES ---
const PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60"
];

// --- UTILS ---
const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};

// --- TOAST COMPONENT ---
const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-6 h-6"/> : <ExclamationCircleIcon className="w-6 h-6"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

// --- ICONS ---
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
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
        className={`flex items-center gap-2 px-4 py-2 bg-transparent text-sm font-semibold transition-all whitespace-nowrap ${isOpen ? 'text-black' : 'text-gray-500 hover:text-black'}`}
      >
        {label}
        <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="py-2">
              {options.map((option, idx) => {
                const displayLabel = typeof option === 'object' ? option.label : option;
                const returnValue = typeof option === 'object' ? option.value : option;
                return (
                    <button 
                      key={idx} 
                      className="w-full text-left px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors border-b border-gray-50 last:border-0"
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

const CreatorCard = ({ creator, onInvite, index }: { creator: CreatorProfile, onInvite: (c: CreatorProfile) => void, index: number }) => {
    const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");

    const placeholderImg = PLACEHOLDERS[index % PLACEHOLDERS.length];

    const togglePlatform = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setPlatform(prev => prev === "instagram" ? "tiktok" : "instagram");
    };

    const handleUrl = platform === "instagram" ? creator.instagram : creator.tiktok;
    const followers = platform === "instagram" ? creator.instagramFollowers : creator.tiktokFollowers;
    const engagement = platform === "instagram" ? creator.instagramEngagementRate : creator.tiktokEngagementRate;

    const getHandle = () => {
        if (!handleUrl) return "Unknown Creator";
        let clean = handleUrl.replace(/(^\w+:|^)\/\//, '').replace("www.", "");
        clean = clean.replace("instagram.com/", "").replace("tiktok.com/", "").replace("@", "");
        if(clean.endsWith("/")) clean = clean.slice(0, -1);
        return clean; 
    };

    const displayName = creator.displayName || getHandle();
    
    const price = creator.pricePerPost ? `₦${Number(creator.pricePerPost).toLocaleString()}` : "N/A";
    const location = creator.location || "Unknown";

    return (
        <div className="bg-white rounded-4xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-transparent hover:border-gray-100">
            {/* Image Container */}
            <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-gray-100 mb-4">
                <Image 
                    src={creator.profileImageUrl || placeholderImg} 
                    alt={displayName} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
            </div>
            
            {/* Text Content */}
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
                        className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white transition-all shadow-md active:scale-95 ${
                            platform === 'instagram' 
                            ? 'bg-linear-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:shadow-orange-200' 
                            : 'bg-black hover:shadow-gray-300'
                        }`}
                    >
                        {platform === 'instagram' ? <InstagramIcon className="w-4 h-4" /> : <TiktokIcon className="w-4 h-4" />}
                    </button>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onInvite(creator); }}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-full transition-colors text-center text-xs active:scale-95"
                    >
                        Invite to Campaign +
                    </button>
                </div>
            </div>
        </div>
    );
};

const InviteModal = ({ isOpen, onClose, creator, onShowToast }: { isOpen: boolean, onClose: () => void, creator: CreatorProfile | null, onShowToast: (msg: string, type: "success"|"error") => void }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // FIXED: Updated formData state to reflect the new payload requirements
    const [formData, setFormData] = useState({
        title: "", description: "", startDate: "", endDate: "", budget: ""
    });

    // Flow: Resets modal state whenever it is opened
    useEffect(() => {
        if(isOpen) {
            setStep(1);
            setFormData({ title: "", description: "", startDate: "", endDate: "", budget: "" });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            onShowToast("Please fill in all fields before proceeding.", "error");
            return;
        }
        setStep(2);
    };

    // Flow: Submits the chat request to backend
    const handleSubmit = async () => {
        if (!formData.budget || !formData.description) {
            onShowToast("Please provide a budget and description.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { onShowToast("You are not logged in.", "error"); return; }

            // FIXED: Updated payload to strictly match the new backend schema
            const payload = {
                creatorId: creator?.userId, 
                title: formData.title,
                message: formData.description,
                proposedPrice: Number(formData.budget),
                startDate: formData.startDate,
                endDate: formData.endDate
            };
            
            console.log("🔵 [API Request] POST /chat-requests PAYLOAD:", payload);
            
            const res = await fetch(`${BASE_URL}/chat-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                console.error("🔴 [API Error] POST /chat-requests FAILED:", await res.text());
                throw new Error("Failed to send request");
            }
            
            console.log("🟢 [API Response] POST /chat-requests SUCCESS");
            onShowToast("Request Sent Successfully!", "success");
            onClose();

        } catch (error: any) {
            console.error("🔴 [Network Error] POST /chat-requests crashed:", error);
            onShowToast(error.message || "Something went wrong.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !creator) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-[95%] max-w-md bg-white rounded-4xl p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-gray-900 overflow-y-auto max-h-[90vh]">
                <button aria-label="close" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>

                <div className={`transition-all duration-300 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 hidden'}`}>
                    {step === 1 && (
                        <div className="space-y-6 mt-2">
                            <h2 className="text-center text-lg font-bold text-gray-900">Start a Campaign</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Title</label>
                                    <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full mt-1 border-b border-gray-200 py-3 text-lg font-medium focus:outline-none focus:border-black transition-colors placeholder-gray-300" placeholder="e.g. Summer Launch" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                                        <input aria-label="input-start-date" type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full mt-1 bg-gray-50 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                                        <input aria-label="input-end-date"type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full mt-1 bg-gray-50 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleNext} className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-gray-800 transition-transform active:scale-95 shadow-xl shadow-gray-200">Next Step</button>
                        </div>
                    )}
                </div>

                <div className={`transition-all duration-300 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
                    {step === 2 && (
                        <div className="space-y-6 mt-2">
                            <div className="flex items-center gap-2 mb-4">
                                <button aria-label="Go back" onClick={() => setStep(1)} className="p-1 rounded-full hover:bg-gray-100"><ArrowLeftIcon className="w-5 h-5" /></button>
                                <h2 className="text-lg font-bold">Campaign Details</h2>
                            </div>
                            
                            {/* FIXED: Removed file upload UI and replaced with description textarea */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Description</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                    rows={4}
                                    className="w-full mt-2 bg-gray-50 rounded-2xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-black resize-none" 
                                    placeholder="Tell the creator about the deliverables..." 
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Budget</label>
                                <div className="relative mt-2">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                    <input type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="0.00" className="w-full bg-gray-50 rounded-2xl py-4 pl-10 pr-4 text-xl font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-black" />
                                </div>
                            </div>

                            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-black text-white font-bold py-4 rounded-full hover:bg-gray-800 transition-transform active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50">
                                {isSubmitting ? "Sending Request..." : "Send Request"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export default function DiscoverPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  
  const [toast, setToast] = useState<{msg: string, type: "success"|"error", visible: boolean}>({ msg: "", type: "success", visible: false });

  const showToast = (msg: string, type: "success"|"error") => {
      setToast({ msg, type, visible: true });
  };

  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ niche: "", price: "", platform: "" });

  // Flow: Re-fetches the creators list every time a filter state changes
  useEffect(() => {
      const fetchCreators = async () => {
          setLoading(true);
          try {
              const params = new URLSearchParams();
              if (filters.niche) params.append("niche", filters.niche.toLowerCase());
              if (filters.price) params.append("maxPrice", filters.price); 
              
              console.log(`🔵 [API Request] GET /creator?${params.toString()}`);
              
              const res = await fetch(`${BASE_URL}/creator?${params.toString()}`, {
                  headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
              });
               
              if (res.ok) {
                  const data = await res.json();
                  console.log("🟢 [API Response] GET /creator SUCCESS:", data);
                  setCreators(data); 
              } else {
                  console.error("🔴 [API Error] GET /creator FAILED:", await res.text());
              }
          } catch (error) {
              console.error("🔴 [Network Error] GET /creator crashed:", error);
          } finally {
              setLoading(false);
          }
      };
      fetchCreators();
  }, [filters]);

  const openInviteModal = (creator: CreatorProfile) => {
      setSelectedCreator(creator);
      setIsModalOpen(true);
  };

  const handleFilterSelect = (type: string, value: string) => {
      setFilters(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className={`flex flex-col min-h-screen bg-[#F8F9FB] ${inter.className} overflow-x-hidden`}>
      
      <Toast 
        message={toast.msg} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />

      <InviteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        creator={selectedCreator} 
        onShowToast={showToast}
      />

      <NavigationPill />

      <main className="w-full flex-1 pb-20 pt-15">
        
        {/* SEARCH & FILTERS SECTION */}
        <div className="px-4 md:px-8 mt-8">
            <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
                
                <div className="w-full max-w-lg relative group">
                    <input 
                        type="text" 
                        placeholder="Search here" 
                        className="w-full bg-white rounded-full py-4 pl-8 pr-4 shadow-sm border border-gray-100 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 transition-shadow" 
                    />
                </div>

                <div className="flex flex-wrap justify-center items-center gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:bg-gray-900 transition-colors"
                    >
                        <AdjustmentsHorizontalIcon className="w-7 h-7 text-white" />
                        Filter
                    </button>

                    {showFilters && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="bg-white rounded-full px-2 py-1 shadow-sm border border-gray-100 flex items-center">
                                <FilterDropdown label={filters.niche || "Niche"} options={FILTER_OPTIONS.niche} onSelect={(val) => handleFilterSelect("niche", val)} />
                                <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                <FilterDropdown label="Price" options={FILTER_OPTIONS.price} onSelect={(val) => handleFilterSelect("price", val)} />   
                            </div>
                            
                            {(filters.niche || filters.price || filters.platform) && (
                                <button aria-label="reset fliters" onClick={() => setFilters({ niche: "", price: "", platform: "" })} className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* CREATORS GRID */}
        <div className="px-4 md:px-8 mt-12">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    </div>
                ) : creators.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {creators.map((creator: CreatorProfile, idx: number) => (
                            <CreatorCard key={creator.id || Math.random()} creator={creator} onInvite={openInviteModal} index={idx} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium text-gray-500">No creators found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}