"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import CreatorNavigationPill from "@/components/CreatorNavigationPill"; 
import { 
  BanknotesIcon, 
  ClockIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  XMarkIcon 
} from "@heroicons/react/24/outline";

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
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } ${type === "success" ? "bg-[#00D68F] text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-6 h-6"/> : <XCircleIcon className="w-6 h-6"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function CreatorDashboardClient() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  
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

  useEffect(() => {
      if (selectedInvite) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => {
          document.body.style.overflow = 'unset';
      };
  }, [selectedInvite]);

  const fetchRequests = async (token: string) => {
      try {
          const res = await fetch(`${BASE_URL}/chat-requests/creator`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setInvites(sortedData);
          } else {
          }
      } catch (error) {
      } finally {
          setLoading(false);
      }
  };

  const fetchEarnings = async (token: string) => {
      try {
          const res = await fetch(`${BASE_URL}/payments/earnings`, {
              headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
              const data = await res.json();
              setEarningsData({
                  totalEarned: data?.totalEarned || 0,
                  totalTransactions: data?.totalTransactions || 0
              });
          } else {
          }
      } catch (error) {
      }
  };

  const handleAction = async (id: string, action: "accept" | "reject", e?: React.MouseEvent) => {
      if (e) e.stopPropagation(); 
      
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
          const res = await fetch(`${BASE_URL}/chat-requests/${id}/${action}`, {
              method: "PATCH",
              headers: { "Authorization": `Bearer ${token}` }
          });

          if (res.ok) {
              if (action === "reject") {
                  showToast(`Request declined`, "error");
              } else {
                  showToast(`Request accepted successfully`, "success");
              }
              setInvites(prev => prev.filter(invite => invite.id !== id));
              setSelectedInvite(null); 
          } else {
              const errorData = await res.json().catch(() => null);
              
              // Handle specific 400 error for duplicate active chats upon acceptance
              if (res.status === 400 && action === "accept") {
                  throw new Error("An active conversation already exists for this business and creator");
              }
              
              throw new Error(errorData?.message || "Action failed");
          }
      } catch (error: any) {
          showToast(error.message || "Something went wrong", "error");
      }
  };

  const formatCreatedAt = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateRange = (start: string, end: string) => {
      if(!start || !end) return "Flexible Dates";
      const s = new Date(start);
      const e = new Date(end);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${s.toLocaleDateString('en-US', options)} - ${e.toLocaleDateString('en-US', options)}`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Creator Dashboard | Caskayd",
    "description": "Manage your incoming brand invites, track your escrow earnings, and oversee your influencer campaigns.",
    "url": "https://www.caskayd.com/creator/dashboard"
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`flex flex-col min-h-screen bg-[#F8F9FB] ${inter.className}`}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      <CreatorNavigationPill />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-20 pt-[140px] md:pt-[160px]">
        <h1 className="sr-only">Creator Dashboard Overview</h1>
        
        <div className="rounded-[3rem] p-6 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative bg-white">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            <div className="bg-white border-2 border-[#34D399] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <BanknotesIcon className="w-5 h-5 text-[#34D399]" /> Total Earnings
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#10B981] tracking-tight">
                    ₦ {earningsData.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div> 

            <div className="bg-white border-2 border-[#818CF8] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <ArrowsRightLeftIcon className="w-5 h-5 text-[#818CF8]" /> Total Transactions
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#5B4DFF] tracking-tight">
                    {earningsData.totalTransactions}
                </div>
            </div>

            <div className="bg-white border-2 border-[#FBBF24] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm h-48 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold text-sm tracking-wide">
                    <ClockIcon className="w-5 h-5 text-[#FBBF24]" /> New Invites
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-[#F59E0B] tracking-tight">
                    {invites.length}
                </div>
            </div>

          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">New Invites</h2>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-6 animate-pulse">
                                <div className="flex-1 w-full">
                                    <div className="h-5 w-24 bg-gray-200 rounded-md mb-3"></div>
                                    <div className="h-6 w-3/4 bg-gray-200 rounded-md mb-3"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
                                        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="h-4 w-28 bg-gray-200 rounded-md sm:mr-4"></div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <div className="h-12 w-full sm:w-28 bg-gray-200 rounded-xl"></div>
                                        <div className="h-12 w-full sm:w-28 bg-gray-200 rounded-xl"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : invites.length > 0 ? (
                    invites.map((invite) => (
                        <div 
                            key={invite.id} 
                            onClick={() => setSelectedInvite(invite)}
                            className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow gap-6 cursor-pointer"
                        >
                            <div className="flex-1 w-full relative">
                                <span className="text-[#C0392B] text-[10px] font-bold uppercase tracking-wide bg-[#FADBD8] px-2.5 py-1 rounded-md inline-block mb-2">
                                    {formatDateRange(invite.startDate, invite.endDate)}
                                </span>
                                
                                <h3 className="text-xl font-bold text-gray-900 mt-1">
                                    {invite.business?.businessName || "Company"}: {invite.displayName}
                                </h3>
                                
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm text-gray-600 font-medium bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                                        Proposed price: ₦{Number(invite.proposedPrice).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                {invite.briefUrl && (
                                    <a 
                                        href={invite.briefUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()} 
                                        className="flex items-center justify-center gap-1.5 text-gray-700 font-bold text-sm hover:text-black transition-colors w-full sm:w-auto"
                                    >
                                        See deliverables <LinkIcon className="w-4 h-4" />
                                    </a>
                                )}
                                
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button 
                                        onClick={(e) => handleAction(invite.id, "accept", e)}
                                        className="flex-1 sm:flex-none bg-[#00D68F] hover:bg-[#00c080] text-black font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        onClick={(e) => handleAction(invite.id, "reject", e)}
                                        className="flex-1 sm:flex-none bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm active:scale-95 cursor-pointer"
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

      {/* MODAL OVERLAY */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-300 ${selectedInvite ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setSelectedInvite(null)} 
      >
        <div 
          className={`bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-10 relative shadow-2xl transform transition-all duration-300 ${selectedInvite ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}
          onClick={(e) => e.stopPropagation()} 
        >
            <button 
              onClick={() => setSelectedInvite(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors z-10 cursor-pointer"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>

            {selectedInvite && (
              <>
                <h3 className="text-2xl font-black text-gray-900 mb-6 pr-12">
                    {selectedInvite.business?.businessName || "Company"}: {selectedInvite.displayName}
                </h3>

                <div className="bg-[#F8F9FB] border border-gray-100 p-6 rounded-2xl mb-8">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Brand-Note</span>
                    <p className="text-gray-800 text-lg leading-relaxed break-words whitespace-pre-wrap">{selectedInvite.message}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-xs text-gray-500 block mb-1">Proposed Price</span>
                        <span className="text-xl font-bold text-[#10B981]">₦{Number(selectedInvite.proposedPrice).toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-xs text-gray-500 block mb-1">Dates</span>
                        <span className="text-lg font-bold text-gray-800">{formatDateRange(selectedInvite.startDate, selectedInvite.endDate)}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="text-xs text-gray-500 block mb-1">Date Sent</span>
                        <span className="text-lg font-bold text-gray-800">{formatCreatedAt(selectedInvite.createdAt)}</span>
                    </div>
                </div>

                <div className="flex gap-4 justify-end border-t border-gray-100 pt-6">
                    <button 
                        onClick={(e) => handleAction(selectedInvite.id, "reject", e)}
                        className="flex-1 sm:flex-none bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 font-bold py-3 px-8 rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                        Decline
                    </button>
                    <button 
                        onClick={(e) => handleAction(selectedInvite.id, "accept", e)}
                        className="flex-1 sm:flex-none bg-[#00D68F] hover:bg-[#00c080] text-black font-bold py-3 px-8 rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                        Accept Invite
                    </button>
                </div>
              </>
            )}
        </div>
      </div>

    </div>
  ); 
}