"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon // added the back arrow icon
} from "@heroicons/react/24/outline";
import Loader from "@/components/Loader"; 

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(https?:\/\/)?(([\da-z\.-]+)\.([a-z\.]{2,6})|localhost(:\d{1,5})?)([\/\w \.-]*)*\/?$/;

const AVAILABLE_INDUSTRIES =["Fashion","Lifestyle","Events","Food & Food Stuff","Beverages","Electronics/Gadgets","Gifts & Gift packages","Arts & Crafts","Retail (General)","Clothing","Jewelry & Accessories","Footwear","Extensions","Bags","Perfumes","Skincare","Transportation / Travel","Hospitality Services","Product Customization"];

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

export default function BusinessSignupClient() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "", password: "",
    businessLogo: null as File | null, companyName: "",
    industryTags: [] as string[], website: "",
    location: "", description: ""
  });

  // New state for OTP verification step
  const [otpCode, setOtpCode] = useState("");

  // New states for Forgot Password flow
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: "", code: "", newPassword: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); 
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);
  
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [recoveryAction, setRecoveryAction] = useState<"discover" | "signup" | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle forgot password inputs
  const handleForgotDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, businessLogo: e.target.files![0] }));
    }
  };

  const showError = (msg: string) => setToast({ message: msg, type: "error", isVisible: true });
  const showSuccess = (msg: string) => setToast({ message: msg, type: "success", isVisible: true });

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

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleRecoveryLogin = async (destination: "discover" | "signup") => {
      setRecoveryAction(destination);
      setIsLoading(true);
      try {
          const loginPayload = { email: formData.email, password: formData.password };
          
          const loginRes = await fetch(`${BASE_URL}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loginPayload),
          });

          if (!loginRes.ok) {
              const errorData = await loginRes.json().catch(() => null);
              
              if (destination === "discover") {
                  showError("Wrong password. Redirecting to login page...");
                  setShowEmailExistsModal(false);
                  await delay(2000);
                  router.push("/business/login");
              } else {
                  showError("Wrong password. Please update it and try again.");
                  setShowEmailExistsModal(false); 
              }
              return;
          }

          const loginData = await loginRes.json();
          const token = loginData.access_token || loginData.token;
          
          localStorage.setItem("accessToken", token);
          setShowEmailExistsModal(false);

          if (destination === "discover") {
              showSuccess("Logged in successfully! Redirecting...");
              setIsRedirecting(true);
              await delay(1000);
              router.push("/business/discover");
          } else {
              showSuccess("Logged in successfully! Resuming setup...");
              await delay(600);
              setStep(3); // Changed from 2 to 3 because step 2 is now OTP
          }

      } catch (error: any) {
          showError("A network error occurred. Please try again.");
      } finally {
          setIsLoading(false);
          setRecoveryAction(null);
      }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 1) return;

    if (!formData.email || !formData.password) return showError("Please fill in all fields");
    if (!EMAIL_REGEX.test(formData.email)) return showError("Please enter a valid email address");
    if (formData.password.length < 6) return showError("Password must be at least 6 characters");
    if (!hasAcceptedTerms) return showError("Kindly go through and accept the Terms and Privacy Policy to create an account.");

    setIsLoading(true);

    try {
        const signupPayload = { email: formData.email, password: formData.password, role: "business" };
        
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signupPayload),
        });

        const signupData = await signupRes.json();
        
        if (!signupRes.ok) {
            
            if (signupRes.status === 400 && signupData.message?.toLowerCase().includes("already registered")) {
                setShowEmailExistsModal(true);
                setIsLoading(false);
                return; 
            }

            throw new Error(signupData.message || "Signup failed. Please try again.");
        }
        
        showSuccess("Account created! Sending OTP...");
        await delay(600);
        
        // Move to OTP step instead of auto-logging in
        setStep(2);

    } catch (error: any) {
        showError(error.message || "An error occurred during signup.");
    } finally {
        setIsLoading(false);
    }
  };

  // Handle OTP submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return showError("Please enter the verification code.");

    setIsLoading(true);

    try {
        // Build payload as specified in instructions
        const verifyPayload = {
            email: formData.email,
            password: formData.password,
            role: "business",
            code: otpCode
        };

        const verifyRes = await fetch(`${BASE_URL}/auth/verify-signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(verifyPayload),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
            throw new Error(verifyData.message || "Invalid OTP code.");
        }

        
        // Save the token from OTP response
        const token = verifyData.access_token || verifyData.token;
        if (token) localStorage.setItem("accessToken", token);

        showSuccess("Email verified! Moving to Profile Setup...");
        await delay(600);
        
        // Move to Profile step
        setStep(3);
    } catch (error: any) {
        showError(error.message || "OTP verification failed.");
    } finally {
        setIsLoading(false);
    }
  };

  // Handle sending the forgot password email
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.email) return showError("Please enter your email.");

    setIsLoading(true);
    try {
        const payload = { email: forgotPasswordData.email };

        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || "Failed to send reset email.");
        }

        showSuccess("Password reset code sent to your email.");
        // Move to the next step in the modal
        setForgotPasswordStep(2);
    } catch (error: any) {
        showError(error.message || "Error requesting password reset.");
    } finally {
        setIsLoading(false);
    }
  };

  // Handle completing the password reset
  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.code || !forgotPasswordData.newPassword) return showError("Please fill all fields.");

    setIsLoading(true);
    try {
        // Assumed standard payload format based on given route
        const payload = { 
            email: forgotPasswordData.email, 
            code: forgotPasswordData.code, 
            newPassword: forgotPasswordData.newPassword 
        };

        const res = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || "Failed to reset password.");
        }

        showSuccess("Password reset successfully! You can now log in.");
        
        // Clean up and close modal
        await delay(1500);
        setShowForgotPasswordModal(false);
        setForgotPasswordStep(1);
        setShowEmailExistsModal(false);
        router.push("/business/login");
    } catch (error: any) {
        showError(error.message || "Error resetting password.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessLogo) return showError("Please upload a business logo to continue.");
    if (!formData.companyName || !formData.website || !formData.location || !formData.description) return showError("Please fill in all details."); 
    if (formData.industryTags.length === 0) return showError("Please select an industry.");
    if (!URL_REGEX.test(formData.website)) return showError("Please enter a valid website URL (e.g., website.com)");

    const token = localStorage.getItem("accessToken");
    if (!token) return showError("Authentication lost. Please log in and try again.");

    setIsLoading(true);

    try {
        const profilePayload = { companyName: formData.companyName };

        const profileUpdateRes = await fetch(`${BASE_URL}/users/business/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(profilePayload)
        });

        if (profileUpdateRes.ok) {
            const profileData = await profileUpdateRes.json();
        } else {
            const errorData = await profileUpdateRes.json().catch(() => null);
        }

        let uploadedLogoUrl = null;
        const uploadData = new FormData();
        uploadData.append("file", formData.businessLogo);

        const uploadRes = await fetch(`${BASE_URL}/upload/avatar`, {
            method: "POST", 
            headers: { "Authorization": `Bearer ${token}` },
            body: uploadData
        });

        if (uploadRes.ok) {
            const uploadResult = await uploadRes.json();
            uploadedLogoUrl = uploadResult.url; 
            showSuccess("Logo uploaded successfully!");
            await delay(500);
        } else {
            const errorData = await uploadRes.json().catch(() => null);
            const errorMessage = errorData?.message || errorData?.error || "Failed to upload logo. File might be too large.";
            throw new Error(errorMessage);
        }

        const businessPayload = {
            companyName: formData.companyName, 
            websiteUrl: formData.website, 
            category: formData.industryTags.join(", "),
            location: formData.location,
            description: formData.description
        };
        

        const businessRes = await fetch(`${BASE_URL}/business`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(businessPayload),
        });

        if (!businessRes.ok) {
            const errorData = await businessRes.json().catch(() => null);
            const errorMessage = errorData?.message || errorData?.error || "Failed to finalize business details. Please try again.";
            throw new Error(errorMessage);
        }
        
        const businessData = await businessRes.json();

        showSuccess("Profile Complete! Redirecting...");
        
        setIsRedirecting(true); 
        await delay(1500);
        router.push("/business/discover");

    } catch (error: any) {
        showError(error.message || "Something went wrong.");
        setIsLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Create a Business Account | Caskayd",
    "description": "Sign up as a brand on Caskayd to discover, hire, and manage top content creators.",
    "url": "https://www.caskayd.com/business/signup"
  };

  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white ${inter.className} overflow-hidden`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                <button aria-label="Close modal" onClick={() => setShowForgotPasswordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                
                {forgotPasswordStep === 1 ? (
                    <form onSubmit={handleRequestPasswordReset}>
                        <p className="text-gray-600 mb-6 text-sm">Enter your email address and we'll send you a recovery code.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" name="email" value={forgotPasswordData.email} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 text-black py-3 px-2 focus:outline-none focus:border-indigo-500" placeholder="user@example.com" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 mt-4">
                            {isLoading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitNewPassword}>
                        <p className="text-gray-600 mb-6 text-sm">Check your email for the code and enter a new password below.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Recovery Code</label>
                            <input type="text" name="code" value={forgotPasswordData.code} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 text-black py-3 px-2 focus:outline-none focus:border-indigo-500" placeholder="123456" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <input type="password" name="newPassword" value={forgotPasswordData.newPassword} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 py-3 px-2 text-black focus:outline-none focus:border-indigo-500" placeholder="Enter new password" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50">
                            {isLoading ? "Resetting..." : "Save New Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
      )}

      {/* --- EMAIL EXISTS MODAL --- */}
      {showEmailExistsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Exists</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    The email <span className="font-semibold text-gray-900 break-all">{formData.email}</span> is already registered. Would you like to go to your dashboard, or resume setting up your profile?
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => handleRecoveryLogin("discover")}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center cursor-pointer"
                    >
                        {isLoading && recoveryAction === "discover" ? "Checking..." : "Login to Discover"}
                    </button>
                    <button 
                        onClick={() => handleRecoveryLogin("signup")}
                        disabled={isLoading}
                        className="w-full bg-indigo-50 text-indigo-700 font-bold py-3.5 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 flex justify-center items-center cursor-pointer"
                    >
                        {isLoading && recoveryAction === "signup" ? "Checking..." : "Resume Profile Setup"}
                    </button>
                    {/* Trigger the new forgot password logic here */}
                    <button 
                        onClick={() => {
                            setForgotPasswordData({ ...forgotPasswordData, email: formData.email });
                            setShowForgotPasswordModal(true);
                        }}
                        className="w-full text-indigo-600 font-semibold py-2 rounded-xl hover:text-indigo-800 transition-colors mt-2 cursor-pointer"
                    >
                        Forgot Password?
                    </button>
                    <button 
                        onClick={() => setShowEmailExistsModal(false)}
                        disabled={isLoading}
                        className="w-full text-gray-500 font-semibold py-2 rounded-xl hover:text-gray-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- INDUSTRY MODAL --- */}
      {isIndustryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
                <button aria-label="Close modal" onClick={closeIndustryModal} className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Select Industry</h2>
                <p className="text-sm text-gray-500 mb-6">Which categories best describe your business? (Max 3)</p>
                <div className="flex flex-wrap gap-3 mb-8">
                    {AVAILABLE_INDUSTRIES.map((ind) => (
                        <button
                            key={ind}
                            type="button"
                            onClick={() => toggleIndustry(ind)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer ${
                                formData.industryTags.includes(ind)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                        >
                            {ind}
                        </button>
                    ))}
                </div>
                <button onClick={closeIndustryModal} className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">Done</button>
            </div>
        </div>
      )}

      <div className="hidden md:block w-1/2 bg-[#EEEDEE] relative overflow-hidden">
        <Image src="/images/business-image.webp" alt="Grow your brand" fill className="object-contain" priority />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-gradient-to-b from-indigo-50/80 to-white md:bg-none md:bg-[#F9FAFB] min-h-screen relative">
        
        {/* back button for mobile only */}
        <button onClick={() => router.back()} className="absolute top-6 left-6 md:hidden text-gray-500 hover:text-gray-900 z-50 cursor-pointer transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>

        <div className="max-w-md w-full relative flex flex-col h-full justify-center">
          
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="sr-only">Create a Business Account on Caskayd</h1>
            <div className="relative w-48 h-16 md:w-40 md:h-12 mb-6"> 
              <Image 
                src="/images/Logo_transparent_icon.webp" 
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
                   {/* Updated progress bar to reflect 3 steps */}
                   <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-indigo-200'}`}></div>
                   <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-indigo-200'}`}></div>
                   <div className={`h-1.5 w-8 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-indigo-200'}`}></div>
               </div>
            )}
          </div>

          <div className="relative w-full overflow-hidden min-h-[680px]">
            {/* STEP 1 - ACCOUNT CREATION */}
            <div className={`absolute inset-0 flex flex-col justify-center w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(1)}`}>
                <form onSubmit={handleNextStep} className="space-y-8 px-1">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500  transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your email" />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 pr-10 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your password" />
                            <button aria-label="show-password" type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 mt-4">
                        <div className="flex items-center h-5">
                            <input 
                                id="terms" 
                                type="checkbox" 
                                checked={hasAcceptedTerms}
                                onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-indigo-300 cursor-pointer" 
                            />
                        </div>
                        <label htmlFor="terms" className="text-sm font-medium text-gray-600">
                            I have read and agree to the{' '}
                            <Link href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms of Service</Link> 
                            {' '}and{' '}
                            <Link href="/privacy" target="_blank" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
                        </label>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && !showEmailExistsModal ? "Processing..." : "Next Step"}
                        </button>
                        <div className="text-center mt-4"><Link href="/business/login" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">Already have an account? <span className="font-semibold underline">Log in</span></Link></div>
                    </div>
                </form>
            </div>

            {/* STEP 2 - OTP VERIFICATION */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(2)}`}>
                <form onSubmit={handleVerifyOtp} className="space-y-6 px-1 pb-4 flex flex-col justify-center h-full pt-10">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
                        <p className="text-sm text-gray-500 mt-2">We sent a verification code to <span className="font-semibold">{formData.email}</span></p>
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                        <input 
                            type="text" 
                            value={otpCode} 
                            onChange={(e) => setOtpCode(e.target.value)} 
                            className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md text-center text-xl tracking-widest font-mono" 
                            placeholder="------" 
                            maxLength={6}
                        />
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? "Verifying..." : "Verify Code"}
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer">
                            Back to Signup
                        </button>
                    </div>
                </form>
            </div>

            {/* STEP 3 - PROFILE SETUP */}
            <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out transform ${getAnimationClass(3)}`}>
                <form onSubmit={handleFinalSubmit} className="space-y-6 px-1 pb-4">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all group overflow-hidden border-4 border-white shadow-lg">
                            <input aria-label="Proflie input" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                            {formData.businessLogo ? <Image src={URL.createObjectURL(formData.businessLogo)} alt="Preview" fill className="object-cover" /> : <ArrowUpTrayIcon className="h-8 w-8 text-white group-hover:-translate-y-1 transition-transform" />}
                        </div>
                        <p className="text-sm font-medium text-gray-600 mt-3 bg-white/60 px-3 py-1 rounded-full">Upload business logo <span className="text-red-500">*</span></p>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Your Company Ltd" />
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="e.g., Lagos, Nigeria" />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Industry <span className="text-gray-400 font-normal text-xs ml-1">(Max 3)</span></label>
                        <div onClick={() => setIsIndustryModalOpen(true)} className="w-full min-h-[46px] border-b border-gray-300 py-2 px-2 bg-white/50 md:bg-transparent cursor-pointer hover:border-indigo-500 transition-all flex flex-wrap items-center gap-2 rounded-t-md">
                            {formData.industryTags.length > 0 ? (
                                formData.industryTags.map(tag => (
                                    <span key={tag} className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 py-1">Select industries (e.g. Fashion, Retail)</span>
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2">
                            Website URL
                            <span className="text-xs font-normal text-gray-500 mt-1">You can also use social links like Instagram, TikTok, etc.</span>
                        </label>
                        <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="https://yourbusiness.com or instagram.com/user" />
                    </div>
                    
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md resize-none" placeholder="Tell us a bit about your brand..." />
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 flex justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && !showEmailExistsModal ? "Setting up Profile..." : "Complete Profile"}
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div> 
      </div>
    </div>
  ); 
}