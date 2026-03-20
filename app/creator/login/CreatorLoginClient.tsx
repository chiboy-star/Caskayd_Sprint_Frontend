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
  XCircleIcon
} from "@heroicons/react/24/outline";
import Loader from "@/components/Loader"; // IMPORT LOADER

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
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-100 flex items-center gap-2 px-6 py-3 rounded-lg shadow-xl transition-all duration-300 ${
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
  const [isRedirecting, setIsRedirecting] = useState(false); // LOADER STATE
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return setToast({ message: "Please fill in all fields", type: "error", isVisible: true });

    setIsLoading(true);
    
    try {
        // Logging the request and payload per Rule #3
        console.log("🔵 [API Request] POST /auth/login PAYLOAD:", { email: formData.email, password: "***" });

        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            // Logging the error response
            console.error("🔴 [API Error] POST /auth/login FAILED:", data);
            throw new Error(data.message || "Invalid credentials");
        }

        // Logging the successful response
        console.log("🟢 [API Response] POST /auth/login SUCCESS:", data);

        const token = data.access_token || data.token;
        if (token) {
            localStorage.setItem("accessToken", token);
            setToast({ message: "Welcome back!", type: "success", isVisible: true });
            
            setIsRedirecting(true); // START LOADER
            await new Promise(resolve => setTimeout(resolve, 2000));
            router.push("/creator/dashboard");
        } else {
            throw new Error("Login successful but no token received.");
        }

    } catch (error: any) {
        // Catch-all log for network or unexpected errors
        console.error("🔴 Login Process Error:", error);
        setToast({ message: error.message || "Login failed", type: "error", isVisible: true });
        setIsLoading(false);
    }
  };

  // SEO: Structured data for the login page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Creator Login | Caskayd",
    "description": "Log in to your Caskayd creator account.",
    "url": "https://www.caskayd.com/creator/login"
  };

  // USE SHARED LOADER
  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-white ${inter.className} overflow-hidden`}>
      {/* Inject Structured Data into the DOM */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      <div className="hidden md:block w-1/2 bg-[#EEEDEE] relative overflow-hidden">
        {/* Converted to .webp */}
        <Image src="/images/creator-image.webp" alt="Monetize Illustration" fill className="object-contain" priority />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-linear-to-b from-emerald-50/80 to-white md:bg-none md:bg-[#F9FAFB] min-h-screen relative">
        <div className="max-w-md w-full relative">
          
          <div className="text-center flex flex-col items-center mb-10">
            {/* SEO Fix: Added a visually hidden H1 tag for Google bots */}
            <h1 className="sr-only">Log in to your Caskayd Creator Account</h1>
            <div className="relative w-48 h-16 md:w-40 md:h-12 mb-6"> 
                {/* Converted to .webp */}
                <Image 
                    src="/images/Logo_transparent_icon.webp" 
                    alt="Caskayd" 
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                /> 
            </div>
            {/* Changed from p to h2 for semantic hierarchy under the hidden h1 */}
            <h2 className="text-sm text-gray-600 font-medium">Welcome Back!</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 px-1">
            <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-gray-300 py-3 px-2 bg-white/50 md:bg-transparent focus:outline-none focus:border-emerald-500 transition-all text-gray-900 placeholder-gray-400 rounded-t-md" placeholder="Enter your email" />
            </div>
            <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
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