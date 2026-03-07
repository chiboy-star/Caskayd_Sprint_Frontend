"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  EyeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/Loader"; 

const inter = Inter({ subsets: ["latin"] });

// --- FIX 1: DYNAMIC BASE URL ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- FIX 2: UPDATED URL REGEX ---
const URL_REGEX = /^(https?:\/\/)?(([\da-z\.-]+)\.([a-z\.]{2,6})|localhost(:\d{1,5})?)([\/\w \.-]*)*\/?$/;

const AVAILABLE_INDUSTRIES = ["fitness", "education", "fashion", "beauty", "tech", 
  "lifestyle", "business", "travel", "Food", "entertainment"];

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
    } ${type === "success" ? "bg-indigo-600 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function BusinessSignup() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "", email: "", password: "",
    businessLogo: null as File | null, businessName: "",
    industryTags: [] as string[], website: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); 
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, businessLogo: e.target.files![0] }));
    }
  };

  const showError = (msg: string) => setToast({ message: msg, type: "error", isVisible: true });

  const toggleIndustry = (industry: string) => {
    setFormData((prev) => {
      const currentTags = prev.industryTags;
      if (currentTags.includes(industry)) return { ...prev, industryTags: currentTags.filter((t) => t !== industry) };
      if (currentTags.length >= 3) { showError("You can only select up to 3 industries"); return prev; }
      return { ...prev, industryTags: [...currentTags, industry] };
    });
  };

  const closeIndustryModal = () => {
    if (formData.industryTags.length < 1) return showError("Please select at least 1 industry");
    setIsIndustryModalOpen(false);
  }

  const getAnimationClass = (sectionStep: number) => {
    if (step === sectionStep) {
        return "translate-x-0 md:translate-y-0 opacity-100 relative z-10";
    } else if (step > sectionStep) {
        return "-translate-x-full md:-translate-y-full opacity-0 absolute z-0 pointer-events-none";
    } else {
        return "translate-x-full md:translate-y-full opacity-0 absolute z-0 pointer-events-none";
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
        if (!formData.username || !formData.email || !formData.password) return showError("Please fill in all fields");
        if (!EMAIL_REGEX.test(formData.email)) return showError("Please enter a valid email address");
        if (formData.password.length < 6) return showError("Password must be at least 6 characters");
        setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.website) return showError("Please fill in all details");
    if (formData.industryTags.length === 0) return showError("Please select an industry");
    
    // Updated Regex Check
    if (!URL_REGEX.test(formData.website)) return showError("Please enter a valid website URL (e.g., website.com)");

    setIsLoading(true);

    try {
        console.log("🔵 Using Backend URL:", BASE_URL);

        // --- 1. SIGNUP ---
        // Flow: Create the core user account in the database
        const signupPayload = { email: formData.email, password: formData.password, role: "business" };
        console.log("🔵 [API Request] POST /auth/signup", signupPayload);
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signupPayload),
        });

        const signupData = await signupRes.json();
        if (!signupRes.ok) {
            console.error("🔴 [API Error] POST /auth/signup FAILED:", signupData);
            throw new Error(signupData.message || "Signup failed");
        }
        console.log("🟢 [API Response] POST /auth/signup SUCCESS:", signupData);

        // --- 2. LOGIN TO GET TOKEN ---
        // Flow: Automatically log the user in so we can perform authenticated actions (like uploading files)
        const loginPayload = { email: formData.email, password: formData.password };
        console.log("🔵 [API Request] POST /auth/login", loginPayload);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload),
        });

        if (!loginRes.ok) {
            console.error("🔴 [API Error] POST /auth/login FAILED:", await loginRes.text());
            throw new Error("Auto-login failed");
        }
        
        const loginData = await loginRes.json();
        const token = loginData.access_token || loginData.token;
        console.log("🟢 [API Response] POST /auth/login SUCCESS. Token received.");

        // --- 3. FILE UPLOAD (If image is selected) ---
        // Flow: Upload the file securely using the JWT token obtained from step 2.
        let uploadedLogoUrl = "";
        if (formData.businessLogo) {
            try {
                console.log("🔵 [API Request] PATCH /users/me/avatar (Uploading file...)");
                const uploadData = new FormData();
                uploadData.append("file", formData.businessLogo);

                // Note: Do not set Content-Type header manually for FormData, the browser sets it automatically
                const uploadRes = await fetch(`${BASE_URL}/users/me/avatar`, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}` // FIXED: Added missing Authorization header
                    },
                    body: uploadData
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    console.log("🟢 [API Response] PATCH /users/me/avatar SUCCESS:", uploadResult);
                    uploadedLogoUrl = uploadResult.avatar; 
                } else {
                    // FIXED: Updated console string to match the actual endpoint
                    console.error("🔴 [API Error] PATCH /users/me/avatar FAILED:", await uploadRes.text());
                }
            } catch (uploadError) {
                console.error("🔴 [Network Error] PATCH /users/me/avatar crashed:", uploadError);
            }
        }

        // --- 4. CREATE BUSINESS PROFILE ---
        // Flow: Attach the business data (and uploaded logo URL) to the user account
        const businessPayload = {
            businessName: formData.businessName,
            websiteUrl: formData.website, 
            category: formData.industryTags.join(", "),
            profileImageUrl: uploadedLogoUrl || undefined // Attach URL if we got one
        };

        console.log("🔵 [API Request] POST /business", businessPayload);
        const businessRes = await fetch(`${BASE_URL}/business`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(businessPayload),
        });

        if (!businessRes.ok) {
            console.error("🔴 [API Error] POST /business FAILED:", await businessRes.text());
            throw new Error("Failed to create business profile");
        }
        
        const businessData = await businessRes.json();
        console.log("🟢 [API Response] POST /business SUCCESS:", businessData);

        // --- ALL DONE ---
        setToast({ message: "Account created! Welcome aboard.", type: "success", isVisible: true });
        localStorage.setItem("accessToken", token);
        
        setIsRedirecting(true); 
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push("/business/discover");

    } catch (error: any) {
        showError(error.message || "Something went wrong.");
        setIsLoading(false);
    }
  };

  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white ${inter.className} overflow-hidden`}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      {isIndustryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button aria-label="Close modal" onClick={closeIndustryModal} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Select Industry</h3>
                <p className="text-sm text-gray-500 mb-6">Which categories best describe your business? (Max 3)</p>
                <div className="flex flex-wrap gap-3 mb-8">
                    {AVAILABLE_INDUSTRIES.map((ind) => (
                        <button
                            key={ind}
                            type="button"
                            onClick={() => toggleIndustry(ind)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                formData.industryTags.includes(ind)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                        >
                            {ind}
                        </button>
                    ))}
                </div>
                <button onClick={closeIndustryModal} className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors">Done</button>
            </div>
        </div>
      )}

      <div className="hidden md:block w-1/2 bg-[#EEEDEE] relative overflow-hidden">
        <Image src="/images/business-image.png" alt="Grow your brand" fill className="object-contain" priority />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-gradient-to-b from-indigo-50/80 to-white md:bg-none md:bg-[#F9FAFB] min-h-screen relative">
        <div className="max-w-md w-full relative">
          
          {/* --- CENTERED LOGO SECTION --- */}
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
            {step === 1 ? (
                <p className="text-sm text-gray-500">Please provide us with the following information</p>
            ) : (
                <div className="flex justify-center gap-2 mt-2">
                   <div className="h-1.5 w-8 rounded-full bg-indigo-200"></div>
                   <div className="h-1.5 w-8 rounded-full bg-indigo-600"></div>
               </div>
            )}
          </div>
          {/* ----------------------------- */}

          <div className="relative w-full overflow-hidden min-h-[480px]">
            {/* STEP 1 */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(1)}`}>
                <form onSubmit={handleNextStep} className="space-y-8 px-1">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500  transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your username" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500  transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your email" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 pr-10 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your password" />
                            <button aria-label="show-password" type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"><EyeIcon className="h-5 w-5" /></button>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5">One more step</button>
                        <div className="text-center mt-4"><Link href="/business/login" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Already have an account? <span className="font-semibold underline">Log in</span></Link></div>
                    </div>
                </form>
            </div>

            {/* STEP 2 */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(2)}`}>
                <form onSubmit={handleFinalSubmit} className="space-y-6 px-1">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden border-4 border-white shadow-lg">
                            <input aria-label="Proflie input" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                            {formData.businessLogo ? <Image src={URL.createObjectURL(formData.businessLogo)} alt="Preview" fill className="object-cover" /> : <ArrowUpTrayIcon className="h-8 w-8 text-white group-hover:-translate-y-1 transition-transform" />}
                        </div>
                        <p className="text-sm font-medium text-gray-600 mt-3 bg-white/60 px-3 py-1 rounded-full">Upload business logo</p>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Your Company Ltd" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Industry <span className="text-gray-400 font-normal text-xs ml-1">(Max 3)</span></label>
                        <div onClick={() => setIsIndustryModalOpen(true)} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent cursor-pointer hover:border-indigo-500  transition-all flex items-center rounded-t-md">
                            {formData.industryTags.length > 0 ? <span className="text-gray-900 font-medium">{formData.industryTags.join(", ")}</span> : <span className="text-gray-400">Select industries (e.g. Fashion, Retail)</span>}
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                        <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="https://yourbusiness.com" />
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 flex justify-center gap-2">
                            {isLoading ? "Creating Account..." : "Let's go!"}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-gray-800 py-2">Go Back</button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}