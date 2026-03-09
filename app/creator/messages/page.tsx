"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import CreatorNavigationPill from "@/components/CreatorNavigationPill"; 
import { 
    MagnifyingGlassIcon, 
    PaperClipIcon, 
    PaperAirplaneIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    XMarkIcon,
    InformationCircleIcon
} from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- TYPES ---
interface User {
    id: string;
    username?: string;
    email?: string;
}

interface Business {
    id: string;
    email?: string;
    avatar?: string | null; 
}

interface Creator {
    id: string;
    user?: User; 
    profileImageUrl?: string;
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

export default function CreatorMessagesPage() {
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

                const res = await fetch(`${BASE_URL}/conversations`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                } 
            } catch (error) {
                console.error("🔴 [Network Error] Failed to load conversations:", error);
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
                    const sorted = data.sort((a: Message, b: Message) => 
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    setMessages(sorted);
                }

                // Mark as read silently
                await fetch(`${BASE_URL}/messages/read/${activeChatId}`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${token}` }
                });

            } catch (error) {
                console.error("🔴 [Network Error] Failed to fetch messages:", error);
            } finally {
                if (!isBackground) setInitialLoadingMessages(false);
            }
        };

        fetchMessages(false);
        const poller = setInterval(() => fetchMessages(true), 3000); 
        return () => clearInterval(poller);

    }, [activeChatId]);

    // --- 3. SEND MESSAGE ---
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const messageToSend = newMessage.trim();
        setNewMessage(""); 

        try {
            const payload = {
                conversationId: activeChatId,
                content: messageToSend,
                type: "TEXT" 
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
                scrollToBottom();
            } else {
                setNewMessage(messageToSend); 
            }
        } catch (error) {
            setNewMessage(messageToSend); 
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const activeConversation = conversations.find(c => c.id === activeChatId);

    // Helpers
    const getBusinessName = (conv?: Conversation) => {
        if (!conv || !conv.business || !conv.business.email) return "Business";
        return conv.business.email; 
    };

    const getInitial = (email?: string) => {
        if (!email) return "B";
        return email.charAt(0).toUpperCase();
    };

    const isMe = (msg: Message) => {
        if (!activeConversation) return false;
        const myId = activeConversation.creator?.id; 
        const myUserId = activeConversation.creator?.user?.id;
        const senderId = msg?.sender?.id;
        
        if (!senderId) return false;
        return senderId === myId || senderId === myUserId;
    };

    const handleChatSelect = (id: string) => {
        setActiveChatId(id);
        setIsDetailsOpen(false); 
    };

    const handleBackToList = () => { 
        setActiveChatId(null); 
        setIsDetailsOpen(false); 
    };

    return (
        <div className={`h-screen w-full flex flex-col bg-[#F8F9FB] ${inter.className} overflow-hidden`}>
            
            <CreatorNavigationPill />

            {/* CHANGED: Increased top padding drastically to clear the navigation pill. Also added bottom padding */}
            <main className="flex-1 flex flex-col min-h-0 w-full max-w-[90rem] mx-auto px-4 md:px-8 pb-10 pt-[140px] md:pt-[160px]">
                
                <div className="flex-1 h-full bg-white rounded-[2.5rem] shadow-lg shadow-gray-200/40 border border-gray-100 flex w-full min-h-0 overflow-hidden relative">
                    
                    {/* --- LEFT PANEL: CONVERSATION LIST --- */}
                    <div className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r border-gray-100 bg-[#FDFDFD] h-full ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                        
                        <div className="p-6 pb-2 shrink-0">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search here" 
                                    className="w-full bg-white rounded-full py-3 pl-11 pr-4 text-sm text-gray-700 placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-shadow" 
                                />
                            </div>
                        </div>

                        <h3 className="text-gray-900 font-bold text-lg mb-2 px-6 pt-4 shrink-0">Conversations</h3>

                        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {loadingConversations ? (
                                // CHANGED: Replaced loading text with a nice skeleton layout
                                <div className="space-y-3 px-2 mt-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
                            ) : (
                                conversations.map((chat) => {
                                    const name = getBusinessName(chat);
                                    const initial = getInitial(chat.business?.email);
                                    const isActive = activeChatId === chat.id;
                                    
                                    return (
                                        <div 
                                            key={chat.id} 
                                            onClick={() => handleChatSelect(chat.id)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                                                isActive 
                                                ? "bg-emerald-50" 
                                                : "hover:bg-gray-50 bg-transparent"
                                            }`}
                                        >
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 relative shrink-0 bg-emerald-100 flex items-center justify-center">
                                                {chat.business?.avatar ? (
                                                    <Image src={chat.business.avatar} alt={name} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-emerald-600 font-bold text-lg">{initial}</span>
                                                )}
                                            </div>
                                            
                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className={`font-bold text-sm truncate ${isActive ? "text-emerald-600" : "text-gray-900"}`}>{name}</h4>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* --- CENTER PANEL: CHAT WINDOW --- */}
                    <div className={`flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                        
                        {activeChatId && activeConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <button onClick={handleBackToList} className="md:hidden p-1 -ml-2 text-gray-600">
                                            <ArrowLeftIcon className="w-5 h-5" />
                                        </button>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden relative border border-gray-100 shrink-0 bg-emerald-100 flex items-center justify-center">
                                            {activeConversation.business?.avatar ? (
                                                <Image src={activeConversation.business.avatar} alt="B" fill className="object-cover" />
                                            ) : (
                                                <span className="text-emerald-600 font-bold text-base">{getInitial(activeConversation.business?.email)}</span>
                                            )}
                                        </div>
                                        
                                        {/* Name & Status */}
                                        <div className="truncate">
                                            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                                                {getBusinessName(activeConversation)}
                                            </h3>
                                            
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 shrink-0">
                                        
                                        
                                        <button 
                                            onClick={() => setIsDetailsOpen(!isDetailsOpen)} 
                                            className={`p-2 rounded-full transition-colors ${isDetailsOpen ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                                        >
                                            <InformationCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <div className="flex justify-center mb-6">
                                        <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">Today</span>
                                    </div>

                                    {initialLoadingMessages ? (
                                        // CHANGED: Replaced spinner with chat bubble skeletons
                                        <div className="space-y-4 animate-pulse">
                                            <div className="flex items-end justify-start gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mb-4"></div>
                                                <div className="bg-gray-100 rounded-2xl rounded-bl-none h-12 w-48"></div>
                                            </div>
                                            <div className="flex items-end justify-end gap-2">
                                                <div className="bg-emerald-100 rounded-2xl rounded-br-none h-16 w-64"></div>
                                            </div>
                                            <div className="flex items-end justify-start gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 mb-4"></div>
                                                <div className="bg-gray-100 rounded-2xl rounded-bl-none h-10 w-32"></div>
                                            </div>
                                        </div>
                                    ) : messages.map((msg) => {
                                        const sentByMe = isMe(msg);
                                        return (
                                            <div key={msg.id} className={`flex items-end gap-2 ${sentByMe ? "justify-end" : "justify-start"}`}>
                                                
                                                {/* Avatar for Incoming Messages */}
                                                {!sentByMe && (
                                                    <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 mb-4 border border-gray-100 bg-emerald-100 flex items-center justify-center">
                                                        {activeConversation.business?.avatar ? (
                                                            <Image src={activeConversation.business.avatar} alt="B" fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-emerald-600 font-bold text-xs">{getInitial(activeConversation.business?.email)}</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-col max-w-[75%] md:max-w-[65%]">
                                                    <div className={`px-5 py-3 text-sm leading-relaxed shadow-sm break-words ${
                                                        sentByMe 
                                                        ? "bg-emerald-500 text-white rounded-2xl rounded-br-none" 
                                                        : "bg-[#F3F4F6] text-gray-900 rounded-2xl rounded-bl-none"
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className={`text-[10px] text-gray-400 mt-1 ${sentByMe ? "text-right" : "text-left"}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
                                    <div className="bg-[#F8F9FB] rounded-2xl px-2 py-2 flex items-center gap-2 border border-gray-100 focus-within:border-emerald-300 transition-colors shadow-sm">
                                        <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-gray-100">
                                            <PaperClipIcon className="w-5 h-5" />
                                        </button>
                                        <input 
                                            type="text" 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault(); 
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Type a message" 
                                            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                        />
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }}
                                            disabled={!newMessage.trim()}
                                            className="bg-emerald-500 p-2.5 rounded-xl text-white hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <PaperAirplaneIcon className="w-8 h-8 text-gray-300 -ml-1 mt-1" />
                                </div>
                                <p className="text-gray-500 font-medium">Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>

                    {/* --- RIGHT PANEL: PROJECT DETAILS (Absolute Slide Out) --- */}
                    <div className={`absolute right-0 top-0 h-full bg-white border-l border-gray-100 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] transition-transform duration-300 ease-in-out z-40 w-full md:w-80 ${
                        isDetailsOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="font-bold text-gray-900 text-lg">Details</h3>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Brief Preview */}
                        <div className="bg-[#EBE9FE] w-full aspect-[4/5] rounded-3xl flex flex-col items-center justify-center text-[#5B4DFF] mb-auto shrink-0">
                            <DocumentTextIcon className="w-16 h-16 mb-4 opacity-80" />
                            <span className="text-sm font-bold">Brief Preview</span>
                        </div>

                        {/* Escrow Status / Action Button */}
                        <div className="w-full bg-[#E8FBE3]/60 rounded-2xl p-5 text-center mt-6 border border-[#D1F7C4] shrink-0">
                            <div className="flex items-center justify-center gap-1.5 text-[#00D68F] text-xs font-bold mb-4 uppercase tracking-wide">
                                <ShieldCheckIcon className="w-4 h-4" /> Escrow Funded
                            </div>
                            <button className="w-full bg-[#D1F7C4] hover:bg-[#bbf0aa] text-[#0A4D36] font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm">
                                Request Payment
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}