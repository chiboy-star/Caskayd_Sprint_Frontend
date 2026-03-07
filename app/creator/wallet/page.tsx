"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill"; 
import { 
  WalletIcon, 
  BanknotesIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- MOCK TRANSACTION DATA (Until backend transaction list API is ready) ---
const TRANSACTIONS = [
  { id: 1, campaign: "Summer promo", date: "Sept 21", status: "Completed", amount: "₦ 10,000.00" },
  { id: 2, campaign: "App Launch", date: "Nov 23", status: "Pending", amount: "₦ 10,000.00" },
  { id: 3, campaign: "Holiday campaign", date: "Sept 21", status: "Completed", amount: "₦ 10,000.00" },
  { id: 4, campaign: "Rebranded", date: "Sept 21", status: "Pending", amount: "₦ 10,000.00" },
];

export default function CreatorWalletPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
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

  if (!isAuthenticated) return null;

  return (
    <div className={`flex flex-col min-h-screen bg-white ${inter.className}`}>
      
      {/* 1. Top Navigation */}
      <CreatorNavigationPill />

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-32 pb-20">
        
        {/* Search Bar */}
        <div className="flex justify-center mb-12">
            <div className="w-full max-w-lg relative group">
                <input 
                    type="text" 
                    placeholder="Search here" 
                    className="w-full bg-white rounded-full py-4 pl-8 pr-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 text-center text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-50 transition-shadow" 
                />
            </div>
        </div>

        {/* Balance Cards Row 
            Updated to a 2x2 grid to accommodate all 4 metrics elegantly
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            
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

        {/* Transaction History Section */}
        <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                
                {/* Left: Title & Filters */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                    
                    {/* Filter Pills */}
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-gray-900 transition-colors">
                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                            Filter
                        </button>

                        <div className="bg-white border border-gray-100 rounded-full px-2 py-1.5 shadow-sm flex items-center gap-1">
                            {["All", "Completed", "Pending"].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === tab 
                                        ? "bg-transparent text-black" 
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {tab}
                                        {/* Status Dot */}
                                        {activeTab === tab && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                tab === "All" ? "bg-emerald-500" :
                                                tab === "Completed" ? "bg-gray-300" : "bg-gray-300"
                                            }`}></div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Withdraw Button */}
                <button className="bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 self-start md:self-center">
                    <BanknotesIcon className="w-5 h-5" /> Withdraw
                </button>
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
                {/* Header Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 text-sm font-bold text-black mb-2 px-6">
                    <div>Campaign</div>
                    <div className="hidden md:block">Date</div>
                    <div className="hidden md:block">Status</div>
                    <div className="text-right">Amount</div>
                </div>

                {/* Rows */}
                <div className="space-y-2">
                    {TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-2 md:grid-cols-4 items-center px-6 py-5 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors text-sm border border-transparent hover:border-gray-100">
                            {/* Campaign */}
                            <div className="font-bold text-gray-900">{tx.campaign}</div>
                            
                            {/* Date (Desktop) */}
                            <div className="hidden md:block text-gray-500 font-medium">{tx.date}</div>
                            
                            {/* Status (Desktop) */}
                            <div className="hidden md:block">
                                <span className={`font-bold ${
                                    tx.status === "Completed" ? "text-emerald-500" : "text-amber-500"
                                }`}>
                                    {tx.status}
                                </span>
                            </div>

                            {/* Amount & Mobile Details */}
                            <div className="text-right">
                                <div className="text-[#5B4DFF] font-bold text-base">{tx.amount}</div>
                                {/* Mobile Status Show */}
                                <div className={`md:hidden text-xs font-bold mt-1 ${
                                    tx.status === "Completed" ? "text-emerald-500" : "text-amber-500"
                                }`}>
                                    {tx.status}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>

      </main>
    </div>
  );
} 