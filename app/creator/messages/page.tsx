"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { 
    Bars3Icon, 
    MagnifyingGlassIcon, 
    PaperClipIcon, 
    PaperAirplaneIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    XMarkIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- ROBUST TYPES (Handling potential API inconsistencies) ---
interface User {
    id: string;
    username?: string;
    email?: string;
}

interface Business {
    id: string;
    businessName?: string; // Might be missing or named differently
    companyName?: string;  // Fallback
    profileImageUrl?: string;
    email?: string;
    user?: User; // Handle nested user if it exists
}

interface Creator {
    id: string;
    user?: User;
    email?: string;
}

interface Conversation {
    id: string;
    business: Business;
    creator: Creator;
    lastMessage?: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string; 
        username?: string;
    };
}

export default function CreatorMessages() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); 
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); 
  
  // Loading States
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [initialLoadingMessages, setInitialLoadingMessages] = useState(false); 
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH CONVERSATIONS ---
  useEffect(() => {
    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            console.log("🐛 [DEBUG] Fetching Conversations...");
            const res = await fetch(`${BASE_URL}/conversations`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log("✅ [DEBUG] Conversations Data:", data);
                setConversations(data);
            } else {
                console.error("❌ [DEBUG] Failed fetch conversations:", await res.text());
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoadingConversations(false);
        }
    };

    fetchConversations();
  }, []);

  // --- 2. FETCH MESSAGES (POLLING) ---
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async (isBackground = false) => {
        if (!isBackground) setInitialLoadingMessages(true);
        
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Ensure messages are sorted by date
                const sorted = data.sort((a: Message, b: Message) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sorted);
                
                if (!isBackground) scrollToBottom();
            }

            // Mark as read silently
            await fetch(`${BASE_URL}/messages/read/${activeChatId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            if (!isBackground) setInitialLoadingMessages(false);
        }
    };

    fetchMessages(false);
    const poller = setInterval(() => fetchMessages(true), 3000); // 3s polling
    return () => clearInterval(poller);

  }, [activeChatId]);

  // --- 3. SEND MESSAGE ---
  const handleSendMessage = async () => {
      if (!newMessage.trim() || !activeChatId) return;

      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
          const payload = {
              conversationId: activeChatId,
              content: newMessage
          };

          const res = await fetch(`${BASE_URL}/messages`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              const savedMessage = await res.json();
              setMessages(prev => [...prev, savedMessage]);
              setNewMessage("");
              scrollToBottom();
          }
      } catch (error) {
          console.error("Failed to send message", error);
      }
  };

  const scrollToBottom = () => {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
  };

  const activeConversation = conversations.find(c => c.id === activeChatId);

  // --- SAFE DATA HELPERS ---
  
  // 1. Get Business Name (Them)
  const getBusinessName = (conv?: Conversation) => {
      if (!conv) return "Business";
      // Try businessName, then companyName, then fallback to email or "Unknown"
      return conv.business?.businessName || 
             conv.business?.companyName || 
             conv.business?.user?.username || 
             "Client";
  };

  // 2. Identify "Me" (Creator Logic)
  const isMe = (msg: Message) => {
      if (!activeConversation) return false;
      
      // Based on your logs: The creator object has the ID directly
      // Fallback: Check creator.user.id just in case structure changes
      const myId = activeConversation.creator?.id || activeConversation.creator?.user?.id;
      
      return msg.sender.id === myId;
  };

  const handleChatSelect = (id: string) => setActiveChatId(id);
  const handleBackToList = () => { setActiveChatId(null); setIsDetailsOpen(false); };

  return (
    <div className={`flex min-h-screen bg-white ${inter.className}`}>
      
      {/* Sidebar Desktop */}
      <div className="hidden md:block w-64 fixed h-full z-20">
        <Sidebar role="creator" className="border-r border-gray-100" />
      </div>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar role="creator" onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-0 md:p-6 w-full h-screen overflow-hidden flex flex-col bg-[#F0F2F5] md:bg-white">
        
        {/* Mobile Header */}
        {!activeChatId && (
            <div className="md:hidden flex justify-between items-center p-4 bg-white border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <button onClick={() => setIsMobileMenuOpen(true)}><Bars3Icon className="w-6 h-6 text-gray-700" /></button>
            </div>
        )}

        {/* --- MAIN CONTAINER --- */}
        <div className="flex-1 md:bg-[#DEDBF9] md:rounded-[2rem] md:p-4 flex md:gap-4 overflow-hidden relative">
            
            {/* 2. LEFT PANEL: CONVERSATION LIST */}
            <div className={`w-full md:w-80 bg-white md:bg-[#CFCBEF] md:rounded-3xl flex flex-col md:p-4 md:border border-white/20 shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Search */}
                <div className="p-4 md:p-0 mb-2 md:mb-6">
                    <div className="bg-gray-100 md:bg-white rounded-full flex items-center px-4 py-3 shadow-sm">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <input type="text" placeholder="Search here" className="bg-transparent outline-none text-sm w-full placeholder-gray-500 text-gray-700" />
                    </div>
                </div>

                <h3 className="hidden md:block text-[#4A47A3] font-bold mb-4 ml-2">Conversations</h3>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-0 md:space-y-3 pr-0 md:pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {loadingConversations ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No conversations yet.</div>
                    ) : (
                        conversations.map((chat) => {
                            const businessName = getBusinessName(chat);
                            return (
                                <div 
                                    key={chat.id} 
                                    onClick={() => handleChatSelect(chat.id)}
                                    className={`flex items-center gap-3 p-4 md:p-3 md:rounded-2xl cursor-pointer transition-all border-b md:border border-gray-100 md:border-transparent ${
                                        activeChatId === chat.id 
                                        ? "bg-indigo-50 md:bg-[#B0AAE6] md:border-[#8E86D9] shadow-sm" 
                                        : "hover:bg-gray-50 md:hover:bg-[#BDB7E9]"
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full flex-shrink-0 relative overflow-hidden border border-gray-200 md:border-2 md:border-white bg-white flex items-center justify-center text-gray-500 font-bold text-lg">
                                        {chat.business?.profileImageUrl ? (
                                            <Image src={chat.business.profileImageUrl} alt="B" fill className="object-cover" />
                                        ) : (
                                            businessName[0]?.toUpperCase() || "B"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{businessName}</h4>
                                            <span className="text-[10px] text-gray-400">Now</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {chat.lastMessage || "Tap to start chatting..."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. MIDDLE PANEL: CHAT WINDOW */}
            <div className={`flex-1 bg-white md:rounded-3xl flex flex-col overflow-hidden shadow-sm relative w-full h-full ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                
                {activeChatId && activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex justify-between items-center bg-white z-20 relative shadow-sm md:shadow-none">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBackToList} className="md:hidden p-1 -ml-2 text-gray-600">
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>

                                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                    {getBusinessName(activeConversation)[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base">
                                        {getBusinessName(activeConversation)}
                                    </h3>
                                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-4">
                                <button 
                                    onClick={() => setIsDetailsOpen(true)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#5B4DFF] transition-colors"
                                >
                                    <InformationCircleIcon className="w-7 h-7" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#EFEAE2] md:bg-white relative z-10">
                            {initialLoadingMessages ? (
                                <div className="flex justify-center mt-10"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 mt-10 text-sm">Say hello! 👋</div>
                            ) : (
                                messages.map((msg) => {
                                    const sentByMe = isMe(msg);
                                    return (
                                        <div key={msg.id} className={`flex w-full ${sentByMe ? "justify-end" : "justify-start"}`}>
                                            
                                            {/* Business Avatar (Only on left for THEIR messages) */}
                                            {!sentByMe && (
                                                <div className="hidden md:flex w-8 h-8 bg-gray-200 rounded-full mr-2 self-end mb-1 overflow-hidden relative border border-gray-100 shrink-0">
                                                    {activeConversation.business?.profileImageUrl ? (
                                                        <Image src={activeConversation.business.profileImageUrl} alt="B" fill className="object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                            {getBusinessName(activeConversation)[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Chat Bubble */}
                                            <div className={`flex flex-col max-w-[80%] md:max-w-[65%]`}>
                                                <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm break-words ${
                                                    sentByMe 
                                                    ? "bg-[#5B4DFF] text-white rounded-2xl rounded-br-none" 
                                                    : "bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-100"
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className={`text-[10px] text-gray-400 mt-1 font-medium ${sentByMe ? "text-right" : "text-left"}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 bg-white border-t border-gray-100 z-20 relative">
                            <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-3">
                                <button className="text-gray-400 hover:text-[#5B4DFF] transition-colors">
                                    <PaperClipIcon className="w-6 h-6 md:w-5 md:h-5" />
                                </button>
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Message" 
                                    className="flex-1 bg-transparent outline-none text-base md:text-sm text-gray-700 placeholder-gray-500"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    className="bg-[#5B4DFF] p-2 rounded-full text-white hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                                    disabled={!newMessage.trim()}
                                >
                                    <PaperAirplaneIcon className="w-5 h-5 md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>

                        {/* --- SLIDING RIGHT PANEL --- */}
                        <div className={`absolute top-0 right-0 h-full w-full md:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:border-l border-gray-100 flex flex-col p-6 z-50 ${isDetailsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-gray-900 text-lg">Project Details</h3>
                                <button onClick={() => setIsDetailsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <div className="bg-[#B8B2E8] w-full aspect-[3/4] rounded-2xl flex flex-col items-center justify-center text-[#5B4DFF] mb-4 shadow-inner">
                                    <DocumentTextIcon className="w-20 h-20 mb-3 opacity-80" />
                                    <span className="text-sm font-bold opacity-80">Brief Preview</span>
                                </div>
                            </div>
                            <div className="w-full bg-[#D1F7C4] rounded-xl p-4 text-center mt-4">
                                <div className="flex items-center justify-center gap-1 text-[#1B5E20] text-xs font-bold mb-3 uppercase tracking-wide">
                                    <ShieldCheckIcon className="w-4 h-4" /> Escrow Funded
                                </div>
                                <button disabled className="w-full bg-[#E8FBE3] text-[#1B5E20]/50 font-bold py-3 rounded-lg text-sm border border-[#A8E6A3] cursor-default">Payment Secured</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><PaperAirplaneIcon className="w-10 h-10 text-gray-300" /></div>
                        <p className="text-lg font-medium text-gray-500">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

        </div>
      </main>
    </div>
  );
}