"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { 
  ArrowLeftOnRectangleIcon,
  UsersIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon
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
    } ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    id: "",
    platform: "instagram", // Default
    followers: "",
    avgLikes: "",
    avgComments: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // new state to prevent UI flash
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });

  // check if user is allowed here before showing the page
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        router.push("/admin/login");
    } else {
        setIsCheckingAuth(false); // safe to show UI now
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.followers || !formData.avgLikes || !formData.avgComments) {
        setToast({ message: "Please fill in all fields", type: "error", isVisible: true });
        return;
    }

    setIsLoading(true);

    try {
        const token = localStorage.getItem("accessToken");

        // prep the payload so we can log it easily
        const payload = {
            creator: { id: formData.id },
            platform: formData.platform,
            followers: Number(formData.followers),
            avgLikes: Number(formData.avgLikes),
            avgComments: Number(formData.avgComments)
        };

        // log the api call intent and what we are sending
        console.log("--- API CALL: Update Metrics ---");
        console.log("Payload:", payload);

        const response = await fetch(`${BASE_URL}/creator/metrics`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update metrics");
        }

        // log the success response
        console.log("Response:", data);

        setToast({ message: "Metrics updated successfully!", type: "success", isVisible: true });
        
        // reset the numbers but keep the ID to save time for the next entry
        setFormData(prev => ({ ...prev, followers: "", avgLikes: "", avgComments: "" }));

    } catch (error: any) {
        // log the error if things go wrong
        console.error("API Error (Update Metrics):", error);
        setToast({ message: error.message || "Something went wrong", type: "error", isVisible: true });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/admin/login"); 
  };

  // hide the whole page until we confirm they have a token
  if (isCheckingAuth) return null;

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${inter.className}`}>
      
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} />

      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">AD</div>
            <span className="font-bold text-lg text-gray-900">Admin Panel</span>
        </div>
        <button 
            onClick={handleLogout}
            className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
        >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Logout
        </button>
      </nav>

      {/* --- CONTENT --- */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 mt-10">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Update Creator Metrics</h2>
            <p className="text-sm text-gray-500 mb-8">Manually override stats for accurate engagement calculation.</p>

            <form onSubmit={handleUpdate} className="space-y-6">
                
                {/* Creator ID */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <IdentificationIcon className="w-4 h-4 text-gray-400" /> Creator ID
                    </label>
                    <input 
                        type="text" 
                        name="id" 
                        value={formData.id} 
                        onChange={handleChange} 
                        placeholder="e.g. nvjfnvojfdnlnlfdldfnofnvjf" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-black text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Platform Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            Platform
                        </label>
                        <div className="relative">
                            <select 
                                name="platform"
                                value={formData.platform}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black text-black appearance-none bg-white outline-none transition-all"
                            >
                                <option value="instagram">Instagram</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Followers */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-gray-400" /> Followers
                        </label>
                        <input 
                            type="number" 
                            name="followers" 
                            value={formData.followers} 
                            onChange={handleChange} 
                            placeholder="e.g. 50000" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black text-black focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Avg Likes */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <HeartIcon className="w-4 h-4 text-gray-400" /> Average Likes
                        </label>
                        <input 
                            type="number" 
                            name="avgLikes" 
                            value={formData.avgLikes} 
                            onChange={handleChange} 
                            placeholder="e.g. 3000" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black text-black focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Avg Comments */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400" /> Average Comments
                        </label>
                        <input 
                            type="number" 
                            name="avgComments" 
                            value={formData.avgComments} 
                            onChange={handleChange} 
                            placeholder="e.g. 200" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black text-black focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-black text-white font-semibold py-3.5 rounded-lg hover:bg-gray-800 transition-all shadow-lg active:scale-[0.99] flex justify-center items-center gap-2"
                    >
                        {isLoading ? "Updating..." : "Save Metrics"}
                    </button>
                </div>

            </form>
        </div>

      </main>
    </div>
  );
}