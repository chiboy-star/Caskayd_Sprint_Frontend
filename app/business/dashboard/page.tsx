"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar"; 
import { 
  Bars3Icon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ClockIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });

// --- MOCK DATA ---
const ACTIVE_CAMPAIGNS = [
  {
    id: 1,
    title: "Ogbomosho fund raiser",
    date: "Jun 1 - Jun 21",
    status: "active",
    action: "Pay all creators"
  },
  {
    id: 2,
    title: "Project X Launch",
    date: "Apr 1 - Apr 21",
    status: "active",
    action: "Pay all creators"
  },
  {
    id: 3,
    title: "Tablet Reconnaissance",
    date: "Mar 1 - Mar 21",
    status: "active",
    action: "Pay all creators"
  }
];

export default function BusinessDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/business/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return null;

  return (
    <div className={`flex min-h-screen bg-white ${inter.className}`}>
      
      {/* Sidebar Desktop */}
      <div className="hidden md:block w-64 fixed h-full z-20">
        <Sidebar role="business" className="border-r border-gray-100" />
      </div>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar role="business" onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full bg-white">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black">Caskayd</h1>
            <button aria-label="sideBar" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg">
                <Bars3Icon className="w-6 h-6 text-black" />
            </button>
        </div>
 
        {/* --- MAIN DASHBOARD CONTAINER (The Lilac Box) --- */}
        <div className="bg-[#CBCCFA] rounded-[2.5rem] p-6 md:p-10 shadow-sm min-h-[85vh] relative">
          
          {/* Top Metrics Row */} 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            {/* Total Budget - Green */}
            <div className="bg-[#D1F7C4] border border-[#A8E6A3] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-emerald-800 font-medium">
                    <CurrencyDollarIcon className="w-5 h-5" /> Total Budget
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-emerald-900 tracking-tight">
                    ₦ 150,000,230
                </div>
            </div>

            {/* Active Campaigns - Red */}
            <div className="bg-[#FAD2D2] border border-[#F5A9A9] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-red-800 font-medium">
                    <ChartBarIcon className="w-5 h-5" /> Active Campaigns
                </div>
                <div className="text-3xl font-extrabold text-red-900">
                    3
                </div>
            </div>

            {/* Pending Actions - Orange */}
            <div className="bg-[#FDECC8] border border-[#FAD689] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-amber-800 font-medium">
                    <ClockIcon className="w-5 h-5" /> Pending actions
                </div>
                <div className="text-3xl font-extrabold text-amber-900">
                    4
                </div>
            </div>

          </div>

          {/* Active Campaign Details Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 ml-1">Active Campaign Details</h2>

            {ACTIVE_CAMPAIGNS.map((campaign) => (
                <div 
                    key={campaign.id} 
                    className="bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow border border-white/50"
                >
                    <div className="mb-4 md:mb-0">
                        <span className="text-red-500 text-xs font-bold uppercase tracking-wide bg-red-50 px-2 py-1 rounded-md">
                            {campaign.date}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">
                            {campaign.title}
                        </h3>
                    </div>

                    <button className="flex items-center gap-1 text-emerald-600 font-semibold text-sm hover:text-emerald-700 hover:underline transition-all">
                        {campaign.action} <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}