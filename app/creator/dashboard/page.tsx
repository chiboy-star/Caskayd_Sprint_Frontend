"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill"; 
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  ClockIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon // Added for Transactions
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
        <div className={`fixed top-28 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-[#00D68F] text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-6 h-6"/> : <XCircleIcon className="w-6 h-6"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function CreatorDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  
  // Updated state to handle the object structure from the API
  const [earningsData, setEarningsData] = useState({
      totalEarned: 0,
      totalTransactions: 0
  }); 
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });

  const showToast = (message: string, type: "success"|"error") => {
      setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/creator/login");
    } else {
      setIsAuthenticated(true);
      fetchRequests(token);
      fetchEarnings(token);
    }
  }, [router]);

  // --- 1. FETCH CHAT REQUESTS ---
  const fetchRequests = async (token: string) => {
      try {
          console.log("🔵 [API Request] GET /chat-requests/creator");
          const res = await fetch(`${BASE_URL}/chat-requests/creator`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              console.log("🟢 [API Response] GET /chat-requests/creator SUCCESS:", data);
              setInvites(data);
          } else {
              console.error("🔴 [API Error] GET /chat-requests/creator FAILED:", await res.text());
          }
      } catch (error) {
          console.error("🔴 [Network Error] GET /chat-requests/creator crashed:", error);
      } finally {
          setLoading(false);
      }
  };

  // --- 2. FETCH EARNINGS ---
  const fetchEarnings = async (token: string) => {
      try {
          console.log("🔵 [API Request] GET /payments/earnings");
          const res = await fetch(`${BASE_URL}/payments/earnings`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              console.log("🟢 [API Response] GET /payments/earnings SUCCESS:", data);
              
              // Set the state using the exact keys from the backend response
              setEarningsData({
                  totalEarned: data?.totalEarned || 0,
                  totalTransactions: data?.totalTransactions || 0
              });
          } else {
              console.error("🔴 [API Error] GET /payments/earnings FAILED:", await res.text());
          }
      } catch (error) {
          console.error("🔴 [Network Error] GET /payments/earnings crashed:", error);
      }
  };

  // --- 3. HANDLE ACCEPT/REJECT ---
  const handleAction = async (id: string, action: "accept" | "reject") => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
          console.log(`🔵 [API Request] PATCH /chat-requests/${id}/${action}`);
          const res = await fetch(`${BASE_URL}/chat-requests/${id}/${action}`, {
              method: "PATCH",
              headers: { "Authorization": `Bearer ${token}` }
          });

          if (res.ok) {
              console.log(`🟢 [API Response] PATCH /chat-requests/${id}/${action} SUCCESS`);
              showToast(`Request ${action}ed successfully`, "success");
              setInvites(prev => prev.filter(invite => invite.id !== id));
          } else {
              const errorData = await res.json();
              console.error(`🔴 [API Error] PATCH /chat-requests/${id}/${action} FAILED:`, errorData);
              throw new Error(errorData.message || "Action failed");
          }
      } catch (error: any) {
          console.error("🔴 [Network Error] Handle Action crashed:", error);
          showToast(error.message || "Something went wrong", "error");
      }
  };

  const formatDateRange = (start: string, end: string) => {
      if(!start || !end) return "Flexible Dates";
      const s = new Date(start);
      const e = new Date(end);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${s.toLocaleDateString('en-US', options)} - ${e.toLocaleDateString('en-US', options)}`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`flex flex-col min-h-screen bg-[#F8F9FB] ${inter.className}`}>
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {/* TOP PILL NAVIGATION */}
      <CreatorNavigationPill />

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-12 pt-32">
        
        {/* --- MAIN DASHBOARD CONTAINER --- */}
        <div className=" rounded-[3rem] p-6 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Total Earnings - Green Border */}
            <div className="bg-white border-2 border-[#34D399] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <BanknotesIcon className="w-5 h-5 text-[#34D399]" /> Total Earnings
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#10B981] tracking-tight">
                    ₦ {earningsData.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div> 

            {/* Total Transactions (Replaced Active Jobs) - Purple Border */}
            <div className="bg-white border-2 border-[#818CF8] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <ArrowsRightLeftIcon className="w-5 h-5 text-[#818CF8]" /> Total Transactions
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#5B4DFF] tracking-tight">
                    {earningsData.totalTransactions}
                </div>
            </div>

            {/* New Invites - Orange Border */}
            <div className="bg-white border-2 border-[#FBBF24] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <ClockIcon className="w-5 h-5 text-[#FBBF24]" /> New Invites
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#F59E0B] tracking-tight">
                    {invites.length}
                </div>
            </div>

          </div>

          {/* New Invites List */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">New Invites</h2>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        Loading invites...
                    </div>
                ) : invites.length > 0 ? (
                    invites.map((invite) => (
                        <div 
                            key={invite.id} 
                            className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow gap-6"
                        >
                            <div className="flex-1">
                                <span className="text-[#C0392B] text-[10px] font-bold uppercase tracking-wide bg-[#FADBD8] px-2.5 py-1 rounded-md inline-block mb-2">
                                    {formatDateRange(invite.startDate, invite.endDate)}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {invite.message}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm text-gray-600 font-medium bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                                        Budget: ₦{Number(invite.proposedPrice).toLocaleString()}
                                    </span>
                                    {invite.business && (
                                        <span className="text-sm text-[#5B4DFF] font-bold">• {invite.business.businessName}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                {invite.briefUrl && (
                                    <a 
                                        href={invite.briefUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 text-gray-700 font-bold text-sm hover:text-black transition-colors w-full sm:w-auto"
                                    >
                                        See deliverables <LinkIcon className="w-4 h-4" />
                                    </a>
                                )}
                                
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => handleAction(invite.id, "accept")}
                                        className="flex-1 sm:flex-none bg-[#00D68F] hover:bg-[#00c080] text-black font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm active:scale-95"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={() => handleAction(invite.id, "reject")}
                                        className="flex-1 sm:flex-none bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm active:scale-95"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 text-gray-500 bg-white rounded-3xl border border-gray-100 font-medium shadow-sm">
                        No new invites at the moment.
                    </div>
                )}
            </div>
          </div>

        </div>
      </main>
    </div>
  ); 
}