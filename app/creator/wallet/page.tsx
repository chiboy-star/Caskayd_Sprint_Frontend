"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar"; 
import { 
  Bars3Icon, 
  WalletIcon, 
  BanknotesIcon,
  MagnifyingGlassIcon 
} from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });

// --- MOCK TRANSACTION DATA ---
const TRANSACTIONS = [
  { id: 1, campaign: "Summer promo", date: "Sept 21", status: "Completed", amount: "₦ 10,000.00" },
  { id: 2, campaign: "App Launch", date: "Nov 23", status: "Pending", amount: "₦ 10,000.00" },
  { id: 3, campaign: "Holiday campaign", date: "Sept 21", status: "Completed", amount: "₦ 10,000.00" },
  { id: 4, campaign: "Rebranded", date: "Sept 21", status: "Pending", amount: "₦ 10,000.00" },
];

export default function CreatorDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/creator/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className={`flex min-h-screen bg-white ${inter.className}`}>
      
      {/* Sidebar Desktop */}
      <div className="hidden md:block w-64 fixed h-full z-20">
        <Sidebar role="creator" className="border-r border-gray-100" />
      </div>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar role="creator" onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full bg-white h-screen overflow-hidden flex flex-col">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-black">Caskayd</h1>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg">
                <Bars3Icon className="w-6 h-6 text-black" />
            </button>
        </div>

        {/* --- MAIN LILAC CONTAINER --- */}
        <div className="bg-[#DEDBF9] rounded-[2.5rem] p-6 md:p-10 shadow-sm flex-1 overflow-y-auto relative">
          
          {/* Search Bar */}
          <div className="flex justify-center mb-10">
             <div className="bg-white rounded-full flex items-center px-6 py-3 shadow-sm w-full max-w-md">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
                <input 
                    type="text" 
                    placeholder="Search here" 
                    className="bg-transparent outline-none text-sm w-full placeholder-gray-400 text-gray-700" 
                />
             </div>
          </div>

          {/* Balance Cards Row */}
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-12">
            
            {/* Escrow Balance (Blue) */}
            <div className="bg-[#9EB9F8] border-2 border-[#3B6AD9] rounded-2xl p-6 w-full max-w-sm flex flex-col items-center justify-center text-center shadow-sm h-32">
                <div className="flex items-center gap-2 mb-1 text-[#2B4EAD] font-medium text-sm">
                    <WalletIcon className="w-5 h-5" /> Escrow Balance
                </div>
                <div className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">
                    ₦ 100,000.00
                </div>
            </div>

            {/* Withdraw Balance (Green) */}
            <div className="bg-[#A7D7C5] border-2 border-[#26A17B] rounded-2xl p-6 w-full max-w-sm flex flex-col items-center justify-center text-center shadow-sm h-32">
                <div className="flex items-center gap-2 mb-1 text-[#1B5E20] font-medium text-sm">
                    <BanknotesIcon className="w-5 h-5" /> Available To Withdraw
                </div>
                <div className="text-3xl font-extrabold text-[#1B5E20] tracking-tight">
                    ₦ 50,000.230
                </div>
            </div>

          </div>

          {/* Transaction History Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-black mb-6">Transaction History</h2>

            {/* Filter Tabs & Withdraw Button */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-6 border-b border-gray-400/30 pb-2 w-full md:w-auto">
                    {["All", "Completed", "Pending"].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-medium pb-1 relative transition-colors ${
                                activeTab === tab ? "text-black" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-[-9px] left-0 w-full h-[3px] bg-[#5B4DFF] rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                <button className="bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95">
                    <BanknotesIcon className="w-5 h-5" /> Withdraw
                </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 text-sm font-bold text-black mb-4 px-4">
                <div>Campaign</div>
                <div>Date</div>
                <div>Status</div>
                <div className="text-right">Amount</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-3">
                {TRANSACTIONS.map((tx) => (
                    <div key={tx.id} className="grid grid-cols-4 items-center px-4 py-3 hover:bg-white/40 rounded-xl transition-colors text-sm">
                        <div className="text-gray-800 font-medium">{tx.campaign}</div>
                        <div className="text-gray-600">{tx.date}</div>
                        <div className={`${tx.status === "Completed" ? "text-emerald-600" : "text-amber-500"} font-medium`}>
                            {tx.status}
                        </div>
                        <div className="text-right text-[#5B4DFF] font-bold">
                            {tx.amount}
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