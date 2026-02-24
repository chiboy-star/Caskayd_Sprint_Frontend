"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon, 
  XMarkIcon, 
  Squares2X2Icon,
  MapPinIcon,
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar"; 

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = "http://localhost:3000";

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
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-[#00D68F] text-black" : "bg-red-500 text-white"}`}>
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
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-.54-2.49.42-5.18 2.45-6.83 1.98-1.63 4.81-1.82 7.01-.52.14.09.28.19.42.29-.01 1.33-.01 2.66-.01 4-.08-.03-.17-.07-.25-.11-.95-.49-2.05-.64-3.11-.42-1.18.24-2.19 1.05-2.67 2.17-.5 1.17-.37 2.54.34 3.59.83 1.25 2.51 1.74 3.94 1.13.92-.38 1.63-1.16 1.93-2.1.26-.81.25-1.68.25-2.53-.02-5.24-.02-10.49-.02-15.73z" />
  </svg>
);

const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};

const FilterDropdown = ({ label, options, onSelect }: { label: string, options: any[], onSelect: (val: string) => void }) => {
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
        className={`flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium transition-all ${isOpen ? 'text-indigo-600 ring-2 ring-indigo-100' : 'text-gray-700 hover:bg-gray-50'}`}
      >
        {label}
        <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 transition-all duration-200 origin-top ${isOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'}`}>
        <div className="py-2">
          {options.map((option, idx) => {
            const displayLabel = typeof option === 'object' ? option.label : option;
            const returnValue = typeof option === 'object' ? option.value : option;
            return (
                <button 
                  key={idx} 
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  onClick={() => { onSelect(returnValue); setIsOpen(false); }}
                >
                  {displayLabel}
                </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CreatorCard = ({ creator, onInvite }: { creator: any, onInvite: (c: any) => void }) => {
    const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");

    const togglePlatform = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setPlatform(prev => prev === "instagram" ? "tiktok" : "instagram");
    };

    const handleUrl = platform === "instagram" ? creator.instagram : creator.tiktok;
    const followers = platform === "instagram" ? creator.instagramFollowers : creator.tiktokFollowers;
    const engagement = platform === "instagram" ? creator.instagramEngagementRate : creator.tiktokEngagementRate;

    const getHandle = () => {
        if (!handleUrl) return "Unknown";
        let clean = handleUrl.replace(/(^\w+:|^)\/\//, '').replace("www.", "");
        clean = clean.replace("instagram.com/", "").replace("tiktok.com/", "").replace("@", "");
        if(clean.endsWith("/")) clean = clean.slice(0, -1);
        return clean; 
    };

    const handle = getHandle();

    return (
        <div className="relative group aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-gray-200">
            {creator.profileImageUrl ? (
                <Image 
                    src={creator.profileImageUrl} 
                    alt={handle} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 flex-col gap-2">
                    <span className="text-sm font-medium">No Image</span>
                </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <button 
                    onClick={(e) => { e.stopPropagation(); onInvite(creator); }}
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-medium hover:bg-white/25 transition-colors backdrop-blur-sm"
                >
                    + Invite
                </button>
                <button 
                    onClick={togglePlatform}
                    className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors z-20"
                >
                     {platform === 'tiktok' ? <TiktokIcon className="w-5 h-5 text-white" /> : <InstagramIcon className="w-5 h-5 text-white" />}
                </button>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                <p className="font-bold text-lg mb-1">{handle}</p>
                <p className="text-xs text-gray-300 mb-2 truncate">{creator.bio || "No bio"}</p>
                <div className="flex items-center gap-2 text-xs text-gray-200 mb-2">
                    <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">{formatNumber(followers)} Follows</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" /> {creator.location || "Unknown"}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium border-t border-white/20 pt-2 mt-2">
                    <span className="text-gray-100">
                        {creator.pricePerPost ? `₦${Number(creator.pricePerPost).toLocaleString()}` : "N/A"}
                    </span>
                    <span className="text-emerald-400">
                        Eng: {engagement ? Number(engagement).toFixed(1) : "0"}%
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- NEW INVITE FLOW COMPONENT ---
const InviteModal = ({ isOpen, onClose, creator, onShowToast }: { isOpen: boolean, onClose: () => void, creator: any, onShowToast: (msg: string, type: "success"|"error") => void }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        startDate: "",
        endDate: "",
        budget: "",
        file: null as File | null
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isOpen) {
            setStep(1);
            setFormData({ title: "", startDate: "", endDate: "", budget: "", file: null });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            onShowToast("Please fill in all fields before proceeding.", "error");
            return;
        }
        
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            onShowToast("End date cannot be before start date.", "error");
            return;
        }

        setStep(2);
    };

    const handleSubmit = async () => {
        if (!formData.budget) {
            onShowToast("Please enter a budget.", "error");
            return;
        }
        if (Number(formData.budget) < 0) {
            onShowToast("Budget cannot be negative.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            // Retrieve token
            const token = localStorage.getItem("accessToken");
            if (!token) {
                onShowToast("You are not logged in.", "error");
                setIsSubmitting(false);
                return;
            }

            // Construct payload
            const payload = {
                creatorId: creator.userId, // Ensure creator object has an ID
                message: `Campaign Request: ${formData.title}`,
                briefUrl: "https://file.pdf", // Static URL as requested
                startDate: formData.startDate,
                endDate: formData.endDate,
                proposedPrice: Number(formData.budget)
            };
            console.log("what is being sent",payload)
            const res = await fetch(`${BASE_URL}/chat-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to send request");
            }

            onShowToast("Request Sent Successfully!", "success");
            onClose();

        } catch (error: any) {
            console.error("Request Error:", error);
            onShowToast(error.message || "Something went wrong.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    if (!isOpen || !creator) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Modal Container */}
            <div className="w-full max-w-md bg-black/85 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 text-white overflow-hidden">
                
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10">
                    <XMarkIcon className="w-5 h-5" />
                </button>

                {/* ANIMATED STEPS CONTAINER */}
                <div className={`transition-all duration-300 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 hidden'}`}>
                    {step === 1 && (
                        <div className="space-y-8 mt-2">
                            <h2 className="text-center text-sm font-semibold tracking-wide text-gray-300 uppercase">Step 1 of 2</h2>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-200">Enter Campaign Title</label>
                                    <input 
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-transparent border-b border-gray-600 py-2 text-lg focus:outline-none focus:border-[#00D68F] transition-colors placeholder-gray-600"
                                        placeholder="e.g. Summer Launch"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-200">Product Timeline</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <CalendarDaysIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <input 
                                                type="date" 
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                                className="w-full bg-gray-700/50 hover:bg-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#00D68F] transition-all cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <CalendarDaysIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <input 
                                                type="date" 
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                                className="w-full bg-gray-700/50 hover:bg-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#00D68F] transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleNext} className="bg-[#00D68F] text-black font-bold py-3 px-8 rounded-full hover:bg-[#00bfa5] transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_15px_rgba(0,214,143,0.3)]">
                                    Next <span>→</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`transition-all duration-300 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
                    {step === 2 && (
                        <div className="space-y-8 mt-2">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
                                    <ArrowLeftIcon className="w-4 h-4" /> Back
                                </button>
                                <h2 className="text-center text-sm font-semibold tracking-wide text-gray-300 uppercase">Step 2 of 2</h2>
                                <div className="w-10"></div> {/* Spacer for centering */}
                            </div>
                            
                            <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                <div 
                                    onClick={handleFileClick}
                                    className="w-24 h-24 bg-[#151520] rounded-full flex items-center justify-center border border-dashed border-gray-600 hover:border-[#00D68F] hover:bg-[#1a1a25] cursor-pointer transition-all group"
                                >
                                    {formData.file ? (
                                        <DocumentIcon className="w-10 h-10 text-[#00D68F]" />
                                    ) : (
                                        <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-300 font-medium">{formData.file ? formData.file.name : "Upload Campaign Brief Doc."}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">PDF, DOCX up to 5MB</p>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-200">Enter Budget:</label>
                                <div className="bg-gray-700/50 rounded-lg flex items-center px-4 py-3 border border-gray-700 focus-within:border-[#00D68F] transition-colors">
                                    <span className="text-gray-400 mr-2 font-mono">₦</span>
                                    <input 
                                        type="number" 
                                        value={formData.budget}
                                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                        placeholder="000000.00"
                                        min="0"
                                        className="bg-transparent w-full focus:outline-none text-white font-mono placeholder-gray-500 text-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="bg-[#00D68F] text-black font-bold py-3 px-12 rounded-full hover:bg-[#00bfa5] transition-transform active:scale-95 shadow-[0_0_15px_rgba(0,214,143,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Sending..." : "Done"}
                                </button>
                            </div>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  
  // TOAST STATE
  const [toast, setToast] = useState<{msg: string, type: "success"|"error", visible: boolean}>({ msg: "", type: "success", visible: false });

  const showToast = (msg: string, type: "success"|"error") => {
      setToast({ msg, type, visible: true });
  };

  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ niche: "", price: "", platform: "" });

  useEffect(() => {
      const fetchCreators = async () => {
          setLoading(true);
          try {
              const params = new URLSearchParams();
              if (filters.niche) params.append("niche", filters.niche.toLowerCase());
              if (filters.price) params.append("maxPrice", filters.price); 
              
              // Backend Endpoint: GET /creator
              const res = await fetch(`${BASE_URL}/creator?${params.toString()}`, {
                  headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
              });
              
              if (res.ok) {
                  const data = await res.json();
                  console.log("Data: ",data)
                  setCreators(data); 
              }
          } catch (error) {
              console.error("Failed to fetch creators", error);
          } finally {
              setLoading(false);
          }
      };
      fetchCreators();
  }, [filters]);

  const openInviteModal = (creator: any) => {
      setSelectedCreator(creator);
      setIsModalOpen(true);
  };

  const handleFilterSelect = (type: string, value: string) => {
      setFilters(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className={`flex min-h-screen bg-white ${inter.className} overflow-x-hidden`}>
      
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

      <div className="hidden md:block w-64 fixed h-full z-20">
        <Sidebar role="business" className="border-r border-gray-100" />
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 md:ml-64 w-full p-4 md:p-6 bg-white min-h-screen">
        <div className="md:hidden flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-black">Caskayd</h1>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <Squares2X2Icon className="w-6 h-6 text-gray-700" />
            </button>
        </div>

        <div className="bg-[#EBEBFF] min-h-[calc(100vh-3rem)] rounded-[2rem] p-6 md:p-10 relative">
            <div className="flex flex-col items-center mb-10 space-y-6">
                <div className="relative w-full max-w-lg">
                    <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search creators..." className="w-full pl-12 pr-4 py-3 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700" />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Filters</span>
                    <div className="flex flex-wrap justify-center gap-3">
                        <FilterDropdown label={filters.niche || "Niche"} options={FILTER_OPTIONS.niche} onSelect={(val) => handleFilterSelect("niche", val)} />
                        <FilterDropdown label="Price" options={FILTER_OPTIONS.price} onSelect={(val) => handleFilterSelect("price", val)} />
                        {(filters.niche || filters.price) && (
                            <button onClick={() => setFilters({ niche: "", price: "", platform: "" })} className="px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-full transition-colors">Reset</button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            ) : creators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {creators.map((creator: any) => (
                        <CreatorCard key={creator.id || Math.random()} creator={creator} onInvite={openInviteModal} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-lg font-semibold">No creators found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}