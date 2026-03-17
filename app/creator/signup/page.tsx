"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
    EyeIcon, 
    EyeSlashIcon,
    ArrowUpTrayIcon, 
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ChevronUpDownIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/Loader"; 

const inter = Inter({ subsets: ["latin"] });

// --- CONFIGURATION ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AVAILABLE_NICHES = [
  "fitness", "education", "fashion", "beauty", "tech", 
  "lifestyle", "business", "travel", "food", "entertainment"
];

const FALLBACK_BANKS = [
    { name: "Access Bank", code: "044" },
    { name: "Guaranty Trust Bank", code: "058" },
    { name: "Kuda Bank", code: "50211" },
    { name: "OPay", code: "999992" },
    { name: "United Bank for Africa", code: "033" },
    { name: "Zenith Bank", code: "057" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000); 
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-lg shadow-xl transition-all duration-300 ${
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
    } ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const NicheModal = ({ isOpen, onClose, selectedNiches, onToggle }: { isOpen: boolean, onClose: () => void, selectedNiches: string[], onToggle: (n: string) => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button aria-label="Close modal" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Select your Niches</h3>
                <p className="text-sm text-gray-500 mb-6">Select between 1 and 3 categories.</p>
                <div className="flex flex-wrap gap-3 mb-8">
                    {AVAILABLE_NICHES.map((niche) => (
                        <button
                            key={niche}
                            type="button"
                            onClick={() => onToggle(niche)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer ${
                                selectedNiches.includes(niche)
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md transform scale-105" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                        >
                            {niche}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">Done</button>
            </div>
        </div>
    );
};

export default function CreatorSignup() {
  const router = useRouter();
  
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    username: "", email: "", password: "", 
    profilePic: null as File | null, 
    nicheTags: [] as string[], bio: "", 
    location: "", 
    rate: "", 
    pricePerPost: "", 
    pricePerStory: "", 
    pricePerVideo: "", 
    instagram: "", tiktok: "", accountNumber: "", bankName: "", bankCode: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });
  
  // NEW: Recovery Modal States
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [recoveryAction, setRecoveryAction] = useState<"dashboard" | "signup" | null>(null);

  const [isNicheModalOpen, setIsNicheModalOpen] = useState(false);
  const [banks, setBanks] = useState<{name: string, code: string}[]>(FALLBACK_BANKS);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBanks = async () => {
        try {
            console.log("🔵 [API Request] GET https://api.paystack.co/bank");
            const response = await fetch("https://api.paystack.co/bank", { method: "GET" });
            if (response.ok) {
                const data = await response.json();
                console.log("🟢 [API Response] GET https://api.paystack.co/bank SUCCESS");
                if (data.status) {
                    const uniqueBanksMap = new Map();
                    data.data.forEach((bank: {name: string, code: string}) => {
                        const normalizedName = bank.name.replace(/\s+/g, ' ').trim().toLowerCase();
                        if (!uniqueBanksMap.has(normalizedName)) {
                            uniqueBanksMap.set(normalizedName, bank);
                        }
                    });
                    
                    const uniqueBanks = Array.from(uniqueBanksMap.values()) as {name: string, code: string}[];
                    uniqueBanks.sort((a, b) => a.name.localeCompare(b.name));
                    setBanks(uniqueBanks);
                    return;
                }
            } else {
                console.error("🔴 [API Error] GET https://api.paystack.co/bank FAILED:", await response.text());
            }
            setBanks(FALLBACK_BANKS);
        } catch (error) {
            console.error("🔴 [Network Error] Failed to fetch banks:", error);
            setBanks(FALLBACK_BANKS);
        }
    };
    fetchBanks();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, profilePic: e.target.files![0] }));
    }
  };

  const showError = (msg: string) => setToast({ message: msg, type: "error", isVisible: true });
  const showSuccess = (msg: string) => setToast({ message: msg, type: "success", isVisible: true });

  const toggleNiche = (niche: string) => {
    setFormData((prev) => {
      const currentTags = prev.nicheTags;
      if (currentTags.includes(niche)) return { ...prev, nicheTags: currentTags.filter((t) => t !== niche) };
      if (currentTags.length >= 3) { showError("You can only select up to 3 niches"); return prev; }
      return { ...prev, nicheTags: [...currentTags, niche] };
    });
  };

  const handleBankSelect = (bank: {name: string, code: string}) => {
      setFormData(prev => ({ ...prev, bankName: bank.name, bankCode: bank.code }));
      setBankSearchTerm(bank.name);
      setIsBankDropdownOpen(false);
  };

  const getAnimationClass = (sectionStep: number) => {
    if (step === sectionStep) {
        return "translate-x-0 md:translate-y-0 opacity-100 relative z-10";
    } else if (step > sectionStep) {
        return "-translate-x-full md:-translate-y-full opacity-0 absolute z-0 pointer-events-none";
    } else {
        return "translate-x-full md:translate-y-full opacity-0 absolute z-0 pointer-events-none";
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // ==========================================
  // RECOVERY LOGIN HANDLER (For Modal)
  // ==========================================
  const handleRecoveryLogin = async (destination: "dashboard" | "signup") => {
      setRecoveryAction(destination);
      setIsLoading(true);
      try {
          console.log(`🔵 [API Request] POST /auth/login (Recovery flow to ${destination})`);
          const loginPayload = { email: formData.email, password: formData.password };
          
          const loginRes = await fetch(`${BASE_URL}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loginPayload),
          });

          if (!loginRes.ok) {
              console.error("🔴 [API Error] POST /auth/login FAILED:", await loginRes.text());
              
              if (destination === "dashboard") {
                  showError("Wrong password. Redirecting to login page...");
                  setShowEmailExistsModal(false);
                  await delay(2000);
                  router.push("/creator/login");
              } else {
                  showError("Wrong password. Please update it and try again.");
                  setShowEmailExistsModal(false); // Keep them on step 1 to fix password
              }
              return;
          }

          const loginData = await loginRes.json();
          const token = loginData.access_token || loginData.token;
          
          console.log("🟢 [API Response] POST /auth/login SUCCESS. Token received.");
          localStorage.setItem("accessToken", token);
          setShowEmailExistsModal(false);

          if (destination === "dashboard") {
              showSuccess("Logged in successfully! Redirecting...");
              setIsRedirecting(true);
              await delay(1000);
              router.push("/creator/dashboard");
          } else {
              showSuccess("Logged in successfully! Resuming setup...");
              await delay(600);
              setStep(2);
          }

      } catch (error) {
          console.error("🔴 [Network Error] Recovery login crashed:", error);
          showError("A network error occurred. Please try again.");
      } finally {
          setIsLoading(false);
          setRecoveryAction(null);
      }
  };

  // ==========================================
  // STEP ROUTING & STEP 1 AUTH LOGIC
  // ==========================================
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Step 1 and Handle Signup/Login
    if (step === 1) {
        if (!formData.username || !formData.email || !formData.password) return showError("Please fill in all fields");
        if (!EMAIL_REGEX.test(formData.email)) return showError("Please enter a valid email address");
        if (formData.password.length < 6) return showError("Password must be at least 6 characters");
        
        setIsLoading(true);

        try {
            const signupPayload = { email: formData.email, password: formData.password, role: "creator" };
            console.log("🔵 [API Request] POST /auth/signup PAYLOAD:", signupPayload);
            
            const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupPayload),
            });

            const signupData = await signupRes.json();
            
            if (!signupRes.ok) {
                console.error("🔴 [API Error] POST /auth/signup FAILED:", signupData);
                
                if (signupRes.status === 400 && signupData.message?.toLowerCase().includes("already registered")) {
                    setShowEmailExistsModal(true);
                    setIsLoading(false);
                    return; 
                }

                throw new Error(signupData.message || "Signup failed. Please try again.");
            }
            
            console.log("🟢 [API Response] POST /auth/signup SUCCESS:", signupData);
            showSuccess("Account created successfully!");
            await delay(500);

            const loginPayload = { email: formData.email, password: formData.password };
            console.log("🔵 [API Request] POST /auth/login PAYLOAD:", loginPayload);
            
            const loginRes = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginPayload),
            });

            if (!loginRes.ok) {
                console.error("🔴 [API Error] POST /auth/login FAILED:", await loginRes.text());
                throw new Error("Auto-login failed. Please try logging in manually.");
            }
            
            const loginData = await loginRes.json();
            const token = loginData.access_token || loginData.token;
            
            console.log("🟢 [API Response] POST /auth/login SUCCESS. Token received.");
            localStorage.setItem("accessToken", token);
            
            showSuccess("Authentication secured. Moving to Step 2...");
            await delay(600);
            
            setStep(2);

        } catch (error: any) {
            showError(error.message || "An error occurred during signup.");
        } finally {
            setIsLoading(false);
        }

    } 
    // Validate Step 2 and move to Step 3
    else if (step === 2) {
        if (!formData.profilePic) return showError("Please upload a profile photo to continue."); // Strictly required
        if (formData.nicheTags.length === 0) return showError("Please select at least one niche.");
        if (!formData.bio) return showError("Please tell us a bit about yourself.");
        if (!formData.location) return showError("Please enter your location.");
        if (!formData.rate) return showError("Please enter your base rate.");
        if (!formData.pricePerPost) return showError("Please enter your price per post.");
        if (!formData.pricePerStory) return showError("Please enter your price per story.");
        if (!formData.pricePerVideo) return showError("Please enter your price per video.");
        
        setStep(3);
    }
  };

  // ==========================================
  // FINAL STEP: PROFILE CREATION
  // ==========================================
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.instagram && !formData.tiktok) return showError("Please provide at least one social media link");
    if (!formData.accountNumber || !formData.bankCode) return showError("Please select a valid bank and enter account number");
    if (formData.accountNumber.length < 10) return showError("Account number looks too short");

    const token = localStorage.getItem("accessToken");
    if (!token) return showError("Authentication lost. Please log in and try again.");

    setIsLoading(true);

    try {
        console.log("🔵 Using Backend URL:", BASE_URL);

        // 1. UPDATE DISPLAY NAME
        const profilePayloadName = { displayName: formData.username };
        console.log("🔵 [API Request] PATCH /users/profile PAYLOAD:", profilePayloadName);

        const profileUpdateRes = await fetch(`${BASE_URL}/users/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(profilePayloadName)
        });

        if (profileUpdateRes.ok) {
            const profileUpdateData = await profileUpdateRes.json();
            console.log("🟢 [API Response] PATCH /users/profile SUCCESS:", profileUpdateData);
        } else {
            console.warn("🟠 [API Warning] PATCH /users/profile FAILED:", await profileUpdateRes.text());
        }

        // 2. UPLOAD PROFILE PICTURE
        let uploadedProfilePicUrl = null;
        if (formData.profilePic) {
            console.log("🔵 [API Request] PATCH /users/me/avatar (Uploading file...)");
            const uploadData = new FormData();
            uploadData.append("file", formData.profilePic);

            const uploadRes = await fetch(`${BASE_URL}/users/me/avatar`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` },
                body: uploadData 
            });

            if (uploadRes.ok) {
                const uploadResult = await uploadRes.json();
                console.log("🟢 [API Response] PATCH /users/me/avatar SUCCESS:", uploadResult);
                uploadedProfilePicUrl = uploadResult.avatar || uploadResult.profileImageUrl; 
            } else {
                console.error("🔴 [API Error] PATCH /users/me/avatar FAILED:", await uploadRes.text());
                throw new Error("Failed to upload profile photo.");
            }
        }

        // 3. CREATE CREATOR PROFILE
        const creatorPayload = {
            displayName: formData.username,
            bio: formData.bio,
            niches: formData.nicheTags.join(", "), // Niches mapping
            location: formData.location,
            tiktok: formData.tiktok,
            instagram: formData.instagram,
            pricePerPost: Number(formData.pricePerPost),
            profileImageUrl: uploadedProfilePicUrl || null
        };
        
        console.log("🔵 [API Request] POST /creator PAYLOAD:", JSON.stringify(creatorPayload, null, 2));
        const profileRes = await fetch(`${BASE_URL}/creator`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(creatorPayload),
        });
        
        const profileData = await profileRes.json();
        if (!profileRes.ok) {
            console.error("🔴 [API Error] POST /creator FAILED:", profileData);
            throw new Error(profileData.message || "Failed to create creator profile");
        }
        console.log("🟢 [API Response] POST /creator SUCCESS:", profileData);

        // 4. CREATE FINANCE SETTINGS
        const financePayload = {
            pricePerPost: Number(formData.pricePerPost),
            pricePerStory: Number(formData.pricePerStory),
            pricePerVideo: Number(formData.pricePerVideo),
            rate: Number(formData.rate),
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
        };
        console.log("🔵 [API Request] POST /creator/finance PAYLOAD:", financePayload);
        
        const financeRes = await fetch(`${BASE_URL}/creator/finance`, { 
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(financePayload),
        });

        const financeData = await financeRes.json();
        if (!financeRes.ok) {
            console.error("🔴 [API Error] POST /creator/finance FAILED:", financeData);
            throw new Error(financeData.message || "Failed to complete finance profile");
        }
        console.log("🟢 [API Response] POST /creator/finance SUCCESS:", financeData);
 
        // 5. CREATE SUBACCOUNT (BANK DETAILS)
        const bankPayload = {
            accountNumber: formData.accountNumber,
            bankCode: formData.bankCode 
        };
        console.log("🔵 [API Request] POST /payments/creator/subaccount PAYLOAD:", bankPayload);
        
        const bankRes = await fetch(`${BASE_URL}/payments/creator/subaccount`, { 
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(bankPayload),
        });

        const bankData = await bankRes.json();
        if (!bankRes.ok) {
            console.error("🔴 [API Error] POST /payments/creator/subaccount FAILED:", bankData);
            throw new Error(bankData.message || "Failed to link bank account");
        }
        console.log("🟢 [API Response] POST /payments/creator/subaccount SUCCESS:", bankData);

        // ALL DONE
        showSuccess("Profile complete! Redirecting...");
        
        setIsRedirecting(true); 
        await delay(1500);
        router.push("/creator/dashboard");

    } catch (error: any) {
        console.error("🔴 Signup Process Error:", error);
        showError(error.message || "Something went wrong. Please try again.");
        setIsLoading(false);
    }
  };

  const filteredBanks = banks.filter(bank => bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase().trim()));

  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white ${inter.className} overflow-hidden`}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      
      {/* --- EMAIL EXISTS MODAL --- */}
      {showEmailExistsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Account Exists</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    The email <span className="font-semibold text-gray-900 break-all">{formData.email}</span> is already registered. Would you like to go to your dashboard, or resume setting up your profile?
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => handleRecoveryLogin("dashboard")}
                        disabled={isLoading}
                        className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center cursor-pointer"
                    >
                        {isLoading && recoveryAction === "dashboard" ? "Checking..." : "Login to Dashboard"}
                    </button>
                    <button 
                        onClick={() => handleRecoveryLogin("signup")}
                        disabled={isLoading}
                        className="w-full bg-emerald-50 text-emerald-700 font-bold py-3.5 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer"
                    >
                        {isLoading && recoveryAction === "signup" ? "Checking..." : "Resume Profile Setup"}
                    </button>
                    <button 
                        onClick={() => setShowEmailExistsModal(false)}
                        disabled={isLoading}
                        className="w-full text-gray-500 font-semibold py-3 rounded-xl hover:text-gray-800 transition-colors mt-2 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      <NicheModal 
        isOpen={isNicheModalOpen} 
        onClose={() => {
            if(formData.nicheTags.length < 1) return showError("Please select at least 1 niche");
            setIsNicheModalOpen(false)
        }} 
        selectedNiches={formData.nicheTags} 
        onToggle={toggleNiche} 
      />

      <div className="hidden md:block w-1/2 bg-[#EEEDEE] relative overflow-hidden">
        <Image src="/images/creator-image.png" alt="Monetize Illustration" fill className="object-contain" priority />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-gradient-to-b from-emerald-50/80 to-white md:bg-none md:bg-[#F9FAFB] min-h-screen relative">
        <div className="max-w-md w-full relative">
          
          <div className="mb-8 flex flex-col items-center text-center"> 
            <div className="relative w-48 h-16 md:w-40 md:h-12 mb-6"> 
                <Image 
                    src="/images/Logo_transparent_icon.png" 
                    alt="Caskayd" 
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                />
            </div>
            <div className="flex justify-center gap-2 mt-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                ))}
            </div>
          </div>

          <div className="relative w-full overflow-hidden min-h-[600px]">
            
            {/* STEP 1 */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(1)}`}>
                <form onSubmit={handleNextStep} className="space-y-8 px-1">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your username" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your email" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 pr-10 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="text-right"><Link href="/creator/login" className="text-xs text-blue-600 hover:underline">Or pick up from where you left</Link></div>
                    <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading && !showEmailExistsModal ? "Processing..." : "Next Step"}
                    </button>
                </form>
            </div>

            {/* STEP 2 */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(2)}`}>
                <form onSubmit={handleNextStep} className="space-y-5 px-1">
                    <div className="flex flex-col items-center justify-center mb-2">
                        <div className="relative w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden border-4 border-white shadow-lg">
                            <input aria-label="input for images" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                            {formData.profilePic ? <Image src={URL.createObjectURL(formData.profilePic)} alt="Preview" fill className="object-cover" /> : <ArrowUpTrayIcon className="h-8 w-8 text-white group-hover:-translate-y-1 transition-transform" />}
                        </div>
                        <p className="text-xs font-medium text-gray-600 mt-2 bg-white/60 px-3 py-1 rounded-full">Upload profile photo <span className="text-red-500">*</span></p>
                    </div>
                    
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="City, Country" />
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Your Niches <span className="text-gray-400 font-normal text-xs ml-1">(Max 3)</span></label>
                        <div onClick={() => setIsNicheModalOpen(true)} className="w-full min-h-[42px] border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent cursor-pointer hover:border-emerald-500 transition-all flex flex-wrap items-center gap-2 rounded-t-md">
                            {formData.nicheTags.length > 0 ? (
                                formData.nicheTags.map(tag => (
                                    <span key={tag} className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 py-1">Select niches (e.g. Beauty, Tech)</span>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Base Rate (Starting At)</label>
                        <input type="number" name="rate" min="0" value={formData.rate} onChange={handleChange} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="₦ 50,000" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Price pre Post</label>
                            <input type="number" name="pricePerPost" min="0" value={formData.pricePerPost} onChange={handleChange} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="₦" />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Price pre Story</label>
                            <input type="number" name="pricePerStory" min="0" value={formData.pricePerStory} onChange={handleChange} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="₦" />
                        </div>
                        <div className="relative col-span-2">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Price pre Video</label>
                            <input type="number" name="pricePerVideo" min="0" value={formData.pricePerVideo} onChange={handleChange} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 text-sm" placeholder="₦" />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={2} className="w-full border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 resize-none text-sm" placeholder="Tell us about yourself..." />
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        {/* CHANGED: Removed the "Go Back" button to prevent user from going back to auth step */}
                        <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 transform hover:-translate-y-0.5 text-sm cursor-pointer">Almost There</button>
                    </div>
                </form>
            </div>

            {/* STEP 3 */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(3)}`}>
                <form onSubmit={handleFinalSubmit} className="space-y-6 px-1">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                        <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="https://instagram.com/username" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">TikTok URL</label>
                        <input type="text" name="tiktok" value={formData.tiktok} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500  transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="https://tiktok.com/@username" />
                    </div>
                    <div className="relative"> 
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                        <div className="relative">
                            <input type="text" value={bankSearchTerm} onChange={(e) => { setBankSearchTerm(e.target.value); setIsBankDropdownOpen(true); setFormData(prev => ({...prev, bankCode: ""})); }} onFocus={() => setIsBankDropdownOpen(true)} className="w-full border-b border-gray-300 py-3 px-2 pr-8 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Search your bank..." />
                            <ChevronUpDownIcon className="absolute right-2 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                        {isBankDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsBankDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full bg-white shadow-xl max-h-48 overflow-y-auto rounded-lg mt-1 border border-gray-100">
                                    {filteredBanks.length > 0 ? filteredBanks.map((bank, index) => (
                                        <div key={`${bank.code}-${index}`} onClick={() => handleBankSelect(bank)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0">{bank.name}</div>
                                    )) : <div className="px-4 py-3 text-sm text-gray-400">No bank found</div>}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                        <input type="text" name="accountNumber" maxLength={10} value={formData.accountNumber} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData(prev => ({...prev, accountNumber: val})) }} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="0000000000" />
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                        <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 transform hover:-translate-y-0.5 flex justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? "Creating Profile..." : "Get Started"}
                        </button>
                        {/* We leave "Go Back" here because going back to Step 2 is safe (no auth calls happened) */}
                        <button type="button" disabled={isLoading} onClick={() => setStep(2)} className="w-full text-center text-sm text-gray-500 hover:text-gray-800 py-2 cursor-pointer disabled:opacity-50">Go Back</button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}