"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill"; 
import { 
  BanknotesIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-lg shadow-xl transition-all duration-300 ${
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
    } ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function CreatorWalletClient() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // State matching the exact payload from your backend log
  const [walletData, setWalletData] = useState({
      completedPayments: 0,
      pendingPayments: 0,
      totalEarned: 0,
      totalTransactions: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/creator/login");
    } else {
      setIsAuthenticated(true);
      fetchWalletData(token);
    }
  }, [router]);

  // --- FETCH EARNINGS ---
  const fetchWalletData = async (token: string) => {
      try {
          console.log("🔵 [API Request] GET /payments/earnings");
          const res = await fetch(`${BASE_URL}/payments/earnings`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              console.log("🟢 [API Response] GET /payments/earnings SUCCESS:", data);
              
              // Set the state dynamically using the backend response
              setWalletData({
                  completedPayments: data?.completedPayments || 0,
                  pendingPayments: data?.pendingPayments || 0,
                  totalEarned: data?.totalEarned || 0,
                  totalTransactions: data?.totalTransactions || 0
              });
          } else {
              console.error("🔴 [API Error] GET /payments/earnings FAILED:", await res.text());
          }
      } catch (error) {
          console.error("🔴 [Network Error] GET /payments/earnings crashed:", error);
      } finally {
          setLoading(false);
      }
  };

  // SEO: Structured data for the Wallet page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Wallet & Earnings | Caskayd Creator",
    "description": "Track your total earnings, pending payments, and total transactions.",
    "url": "https://www.caskayd.com/creator/wallet"
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`flex flex-col min-h-screen bg-white ${inter.className}`}>
      {/* Inject Structured Data into the DOM */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 1. Top Navigation */}
      <CreatorNavigationPill />

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-32 pb-20">
        
        {/* SEO Fix: Added a visually hidden H1 tag for Google bots */}
        <h1 className="sr-only">Creator Wallet and Financial Dashboard</h1>

        {/* Balance Cards Row - 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* 1. Total Earned (Available) - Green */}
            <div className="bg-white border-2 border-[#34D399] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 relative overflow-hidden group transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-medium text-sm">
                    <BanknotesIcon className="w-5 h-5 text-[#34D399]" /> 
                    <span>Total Earned</span>
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#10B981] tracking-tight">
                    {loading ? "..." : `₦ ${walletData.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
            </div>

            {/* 2. Pending Payments (Escrow) - Blue */}
            <div className="bg-white border-2 border-[#818CF8] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 relative overflow-hidden group transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-medium text-sm">
                    <ClockIcon className="w-5 h-5 text-[#818CF8]" /> 
                    <span>Pending (In Escrow)</span>
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#5B4DFF] tracking-tight">
                    {loading ? "..." : `₦ ${walletData.pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
            </div>

            {/* 3. Completed Payments - Teal/Indigo */}
            <div className="bg-white border-2 border-[#2DD4BF] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 relative overflow-hidden group transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-medium text-sm">
                    <CheckBadgeIcon className="w-5 h-5 text-[#2DD4BF]" /> 
                    <span>Completed Payments</span>
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#0F766E] tracking-tight">
                    {loading ? "..." : `₦ ${walletData.completedPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
            </div>

            {/* 4. Total Transactions (Count, not Currency) - Orange */}
            <div className="bg-white border-2 border-[#FBBF24] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 relative overflow-hidden group transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-medium text-sm">
                    <ArrowsRightLeftIcon className="w-5 h-5 text-[#FBBF24]" /> 
                    <span>Total Transactions</span>
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#D97706] tracking-tight">
                    {loading ? "..." : walletData.totalTransactions}
                </div>
            </div>

        </div>

      </main>
    </div>
  );
}