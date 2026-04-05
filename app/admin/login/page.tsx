"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { 
  CheckCircleIcon,
  XCircleIcon, 
  ShieldCheckIcon   
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
    } ${type === "success" ? "bg-black text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // log the attempt and what we are sending
      console.log("--- API CALL: Admin Login ---");
      console.log("Payload:", { email: formData.email, password: "***" });

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Invalid admin credentials");

      // log the success response
      console.log("Response:", data);

      const token = data.access_token || data.token;
      localStorage.setItem("accessToken", token);

      setToast({ message: "Admin access granted", type: "success", isVisible: true });
      
      setIsRedirecting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/admin/dashboard");

    } catch (error: unknown) {
      // log the error
      console.error("API Error (Admin Login):", error);
      
      let msg = "Login failed";
      if (error instanceof Error) msg = error.message;
      setToast({ message: msg, type: "error", isVisible: true });
      setIsLoading(false);
    }
  };

  if (isRedirecting) return <Loader />;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 ${inter.className}`}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />
      
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-gray-300">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-sm text-gray-500">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="admin@caskayd.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-gray-50 border text-black border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-transform active:scale-[0.98] shadow-md"
          >
            {isLoading ? "Authenticating..." : "Access Dashboard"}
          </button>

          <div className="text-center mt-4">
            <Link href="/admin/signup" className="text-xs text-gray-500 hover:text-black hover:underline transition-colors">
                Create new admin account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}