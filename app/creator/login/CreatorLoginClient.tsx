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
  XMarkIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/Loader"; 

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000); 
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

export default function CreatorLoginClient() {
  const router = useRouter();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); 
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2>(1);
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: "", code: "", newPassword: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return setToast({ message: "Please fill in all fields", type: "error", isVisible: true });

    setIsLoading(true);
    
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Invalid credentials");

        const token = data.access_token || data.token;
        if (token) {
            localStorage.setItem("accessToken", token);
            setToast({ message: "Welcome back!", type: "success", isVisible: true });
            
            setIsRedirecting(true); 
            await new Promise(resolve => setTimeout(resolve, 2000));
            router.push("/creator/dashboard");
        } else {
            throw new Error("Login successful but no token received.");
        }
    } catch (error: any) {
        setToast({ message: error.message || "Login failed", type: "error", isVisible: true });
        setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.email) return setToast({ message: "Please enter your email", type: "error", isVisible: true });

    setIsLoading(true);
    try {
        const payload = { email: forgotPasswordData.email };
        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || "Failed to send reset email.");

        setToast({ message: "Reset code sent to your email", type: "success", isVisible: true });
        setForgotPasswordStep(2);
    } catch (error: any) {
        setToast({ message: error.message || "Error requesting reset", type: "error", isVisible: true });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordData.code || !forgotPasswordData.newPassword) return setToast({ message: "Please fill all fields", type: "error", isVisible: true });

    setIsLoading(true);
    try {
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

        if (!res.ok) throw new Error(data.message || "Failed to reset password.");

        setToast({ message: "Password reset successfully!", type: "success", isVisible: true });
        
        setTimeout(() => {
            setShowForgotPasswordModal(false);
            setForgotPasswordStep(1);
            setForgotPasswordData({ email: "", code: "", newPassword: "" });
        }, 1500);

    } catch (error: any) {
        setToast({ message: error.message || "Error resetting password", type: "error", isVisible: true });
    } finally {
        setIsLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Creator Login | Caskayd",
    "description": "Log in to your Caskayd creator account.",
    "url": "https://www.caskayd.com/creator/login"
  };

  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white ${inter.className} overflow-hidden`}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
                {/* Fix: Clear state on manual close */}
                <button 
                  aria-label="Close modal" 
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordStep(1);
                    setForgotPasswordData({ email: "", code: "", newPassword: "" });
                  }} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                
                {forgotPasswordStep === 1 ? (
                    <form onSubmit={handleRequestPasswordReset}>
                        <p className="text-gray-600 mb-6 text-sm">Enter your email address and we'll send you a recovery code.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input type="email" name="email" value={forgotPasswordData.email} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 py-3 px-2 focus:outline-none text-black focus:border-emerald-500" placeholder="user@example.com" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50 mt-4 cursor-pointer">
                            {isLoading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitNewPassword}>
                        <p className="text-gray-600 mb-6 text-sm">Check your email for the code and enter a new password below.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Recovery Code</label>
                            <input type="text" name="code" value={forgotPasswordData.code} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 text-black py-3 px-2 focus:outline-none focus:border-emerald-500" placeholder="123456" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <input type="password" name="newPassword" value={forgotPasswordData.newPassword} onChange={handleForgotDataChange} className="w-full border-b border-gray-300 text-black py-3 px-2 focus:outline-none focus:border-emerald-500" placeholder="Enter new password" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50 cursor-pointer">
                            {isLoading ? "Resetting..." : "Save New Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
      )}

      <div className="hidden md:block w-1/2 bg-[#EEEDEE] relative overflow-hidden">
        <Image src="/images/creator-image.webp" alt="Monetize Illustration" fill className="object-contain" priority />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-linear-to-b from-emerald-50/80 to-white md:bg-none md:bg-[#F9FAFB] min-h-screen relative">
      <button onClick={() => router.back()} className="absolute top-6 left-6 md:hidden text-gray-500 hover:text-gray-900 z-50 cursor-pointer transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="max-w-md w-full relative">
          
          <div className="text-center flex flex-col items-center mb-10">
            <h1 className="sr-only">Log in to your Caskayd Creator Account</h1>
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
            <h2 className="text-sm text-gray-600 font-medium">Welcome Back!</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 px-1">
            <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your email" />
            </div>
            <div className="relative">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <button type="button" onClick={() => setShowForgotPasswordModal(true)} className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer">
                        Forgot Password?
                    </button>
                </div>
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 pr-10 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your password" />
                    <button aria-label="show-password" type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
                </div>
            </div>
            <div className="text-left"><Link href="/creator/signup" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">Are you new? Click here to sign up</Link></div>
            <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 transform hover:-translate-y-0.5 flex justify-center gap-2 cursor-pointer">{isLoading ? "Signing In..." : "Jump In"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}