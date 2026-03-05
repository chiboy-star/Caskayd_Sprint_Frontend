"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Squares2X2Icon, 
  ChatBubbleLeftRightIcon, 
  ArrowLeftOnRectangleIcon, 
  XMarkIcon,
  WalletIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface SidebarProps {
  role?: "business" | "creator"; // Added 'creator' role
  onClose?: () => void;
  className?: string;
}

export default function Sidebar({ role = "business", onClose, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push(role === "business" ? "/business/login" : "/creator/login");
  };

  // Define menu items based on role
  const menuItems = role === "business" ? [
    { name: "Dashboard", href: "/business/dashboard", icon: Squares2X2Icon },
    { name: "Discover", href: "/business/discover", icon: GlobeAltIcon },
    { name: "Messages", href: "/business/messages", icon: ChatBubbleLeftRightIcon },
  ] : [ 
    // Creator Menu Items
    { name: "Dashboard", href: "/creator/dashboard", icon: Squares2X2Icon },
    { name: "Wallet", href: "/creator/wallet", icon: WalletIcon },
    { name: "Messages", href: "/creator/messages", icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className={`bg-[#F9FAFB] h-full flex flex-col justify-between p-6 ${className}`}>
      
      {/* Top Section */} 
      <div>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-extrabold text-black tracking-tight">Caskayd</h1>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1 rounded-md hover:bg-gray-200">
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          )}
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? "text-[#165E3D] bg-white shadow-sm border border-gray-100" // Active style
                    : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-[#165E3D]" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div>
        {/* User Profile Snippet (Optional - Static for now) */}
        <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                 {/* Placeholder Avatar */}
                 <Image src="/images/avatar_placeholder.png" alt="User" width={40} height={40} className="object-cover" />
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{role === 'business' ? 'Marketing Director' : 'Creator Account'}</p>
                <p className="text-xs text-gray-400 truncate">user@caskayd.com</p>
            </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
        </button>
        
        <p className="text-[10px] text-gray-400 text-center mt-4">© 2026 Caskayd Enterprises</p>
      </div>
    </div>
  );
}