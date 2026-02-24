"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar"; 
import { 
  Bars3Icon, 
  BanknotesIcon, 
  ChartBarIcon, 
  ClockIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
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
    }
  }, [router]);

  const fetchRequests = async (token: string) => {
      try {
          const res = await fetch(`${BASE_URL}/chat-requests/creator`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              // Assuming the API returns an array of request objects
              setInvites(data);
          }
      } catch (error) {
          console.error("Failed to fetch requests", error);
      } finally {
          setLoading(false);
      }
  };

  const handleAction = async (id: string, action: "accept" | "reject") => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
          const res = await fetch(`${BASE_URL}/chat-requests/${id}/${action}`, {
              method: "PATCH",
              headers: { "Authorization": `Bearer ${token}` }
          });

          if (res.ok) {
              showToast(`Request ${action}ed successfully`, "success");
              // Remove the processed invite from the list locally to update UI immediately
              setInvites(prev => prev.filter(invite => invite.id !== id));
          } else {
              const errorData = await res.json();
              throw new Error(errorData.message || "Action failed");
          }
      } catch (error: any) {
          showToast(error.message || "Something went wrong", "error");
      }
  };

  // Helper to format date range simply (e.g. "Jun 1 - Jun 21")
  const formatDateRange = (start: string, end: string) => {
      if(!start || !end) return "Flexible Dates";
      const s = new Date(start);
      const e = new Date(end);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${s.toLocaleDateString('en-US', options)} - ${e.toLocaleDateString('en-US', options)}`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`flex min-h-screen bg-white ${inter.className}`}>
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

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
      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full bg-white">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-black">Caskayd</h1>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg">
                <Bars3Icon className="w-6 h-6 text-black" />
            </button>
        </div>

        {/* --- MAIN DASHBOARD CONTAINER (Lilac) --- */}
        <div className="bg-[#DEDBF9] rounded-[2.5rem] p-6 md:p-10 shadow-sm min-h-[85vh] relative">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            
            {/* Total Earnings - Green */}
            <div className="bg-[#D1F7C4] border-2 border-[#26A17B] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-32">
                <div className="flex items-center gap-2 mb-1 text-[#1B5E20] font-bold text-sm">
                    <BanknotesIcon className="w-5 h-5" /> Total Earnings
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-[#1B5E20] tracking-tight">
                    ₦ 0.00
                </div>
            </div>

            {/* Active Jobs - Pink/Red */}
            <div className="bg-[#F6A5B6] border-2 border-[#C0392B] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-32">
                <div className="flex items-center gap-2 mb-1 text-[#922B21] font-bold text-sm">
                    <ChartBarIcon className="w-5 h-5" /> Active Jobs
                </div>
                <div className="text-3xl font-extrabold text-[#922B21]">
                    0
                </div>
            </div>

            {/* New Invites - Orange */}
            <div className="bg-[#FAD7A0] border-2 border-[#D35400] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm h-32">
                <div className="flex items-center gap-2 mb-1 text-[#A04000] font-bold text-sm">
                    <ClockIcon className="w-5 h-5" /> New Invites
                </div>
                <div className="text-3xl font-extrabold text-[#A04000]">
                    {invites.length}
                </div>
            </div>

          </div>

          {/* New Invites List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-black mb-4 ml-1">New Invites</h2>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading invites...</div>
            ) : invites.length > 0 ? (
                invites.map((invite) => (
                    <div 
                        key={invite.id} 
                        className="bg-white rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow gap-4"
                    >
                        <div className="flex-1">
                            <span className="text-[#C0392B] text-[10px] font-bold uppercase tracking-wide bg-[#FADBD8] px-2 py-1 rounded-md inline-block mb-1">
                                {formatDateRange(invite.startDate, invite.endDate)}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">
                                {invite.message}
                            </h3>
                            <div className="flex gap-2 mt-1">
                                <span className="text-xs text-gray-500 font-medium">Budget: ₦{Number(invite.proposedPrice).toLocaleString()}</span>
                                {invite.business && (
                                    <span className="text-xs text-indigo-600 font-medium">• {invite.business.businessName}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {invite.briefUrl && (
                                <a 
                                    href={invite.briefUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-black font-semibold text-xs hover:underline decoration-black underline-offset-2 mr-2"
                                >
                                    See deliverables <LinkIcon className="w-3 h-3" />
                                </a>
                            )}
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => handleAction(invite.id, "accept")}
                                    className="flex-1 md:flex-none bg-[#00D68F] hover:bg-[#00c080] text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => handleAction(invite.id, "reject")}
                                    className="flex-1 md:flex-none bg-[#FF0000] hover:bg-[#d90000] text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 text-gray-500 bg-white/50 rounded-2xl">
                    No new invites at the moment.
                </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}