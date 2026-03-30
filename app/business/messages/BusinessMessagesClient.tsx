"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import NavigationPill from "@/components/NavigationPill"; 
import { 
    MagnifyingGlassIcon, 
    PaperClipIcon, 
    PaperAirplaneIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ArrowLeftIcon,
    XMarkIcon,
    BanknotesIcon,
    CheckCircleIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import { Inter } from "next/font/google";
import { useSocket } from "@/components/SocketContext";

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
    businessName?: string;
    profileImageUrl?: string;
    user?: User; 
}

interface Creator {
    id: string;
    email?: string;
    avatar?: string | null; 
}

interface Conversation {
    conversationId: string;
    userId: string;
    avatar: string | null;
    displayName: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    fileUrl?: string | null;
    fileName?: string | null;
    type?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    sender: {
        id: string; 
        username?: string;
    };
}

// --- TOAST COMPONENT ---
const Toast = ({ message, type, isVisible, onClose }: { message: string, type: "success"|"error", isVisible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 4000); 
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        } ${type === "success" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"}`}>
            {type === "success" ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
            <span className="font-bold text-sm">{message}</span>
        </div>
    );
};

export default function BusinessMessagesClient() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null); 
    const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0);
    
    const { socket, isConnected } = useSocket();
    const [searchQuery, setSearchQuery] = useState("");
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [initialLoadingMessages, setInitialLoadingMessages] = useState(false); 
    
    const [newMessage, setNewMessage] = useState("");
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [toast, setToast] = useState({ message: "", type: "success" as "success"|"error", isVisible: false });
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: "success"|"error") => setToast({ message, type, isVisible: true });

    const activeConversation = conversations.find(c => c.conversationId === activeChatId);

    const getCreatorName = (conv?: Conversation) => {
        if (!conv) return "Creator";
        return conv.displayName || `User ${conv.userId.substring(0, 4)}`;
    };

    const getInitial = (nameFallback?: string) => {
        if (!nameFallback) return "C";
        return nameFallback.charAt(0).toUpperCase();
    };

    const isMe = (msg: Message) => {
        if (!activeConversation) return false;
        if (msg?.sender?.id === "me") return true; 
        
        const senderId = msg?.sender?.id;
        if (!senderId) return false;
        
        return senderId !== activeConversation.userId;
    };

    const handleChatSelect = (id: string) => {
        setActiveChatId(id);
    };

    const handleBackToList = () => { 
        setActiveChatId(null); 
    };

    const filteredConversations = conversations.filter(chat => 
        getCreatorName(chat).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const fetchUnreadCount = async (token: string) => {
        try {
            const res = await fetch(`${BASE_URL}/messages/unread/count`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const count = typeof data === 'number' ? data : (data.count || data.unreadCount || 0);
                setGlobalUnreadCount(count);
            }
        } catch (error) {
            console.error("🔴 [Network Error] GET /messages/unread/count failed:", error);
        }
    };

    // --- API FALLBACK: Fetch Messages Function ---
    const fetchMessages = async (showLoadingState = false) => {
        if (!activeChatId) return;
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        if (showLoadingState) setInitialLoadingMessages(true);

        try {
            const res = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const sorted = data.sort((a: Message, b: Message) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                
                // Only update state if the length changed to prevent aggressive re-renders
                setMessages(prev => {
                    if (prev.length !== sorted.length) {
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                        return sorted;
                    }
                    return prev;
                });
            }

            // Silently mark as read in the background
            await fetch(`${BASE_URL}/messages/read/${activeChatId}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchUnreadCount(token);
            
        } catch (error) {
            console.error("🔴 [Fallback Polling Error]:", error);
        } finally {
            if (showLoadingState) setInitialLoadingMessages(false);
        }
    };

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) return;

                await fetchUnreadCount(token);

                console.log("🔵 [API Request] GET /conversations");
                const res = await fetch(`${BASE_URL}/conversations`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("🟢 [API Response] GET /conversations SUCCESS:", data);
                    setConversations(data);
                } else {
                    console.error("🔴 [API Error] GET /conversations FAILED:", await res.text());
                }
            } catch (error) {
                console.error("🔴 [Network Error] GET /conversations crashed:", error);
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConversations();
    }, []);

    // Reworked Chat UseEffect to incorporate polling
    useEffect(() => {
        if (!activeChatId) {
            if (socket && isConnected) {
                socket.emit("active_chat", { conversationId: null });
            }
            return;
        }

        if (socket && isConnected) {
            console.log(`🔵 [WebSocket] Emitting active_chat for: ${activeChatId}`);
            socket.emit("active_chat", { conversationId: activeChatId });
        }

        // 1. Fetch immediately on load with loading spinner
        fetchMessages(true);

        // 2. Set up the 3-second polling fallback
        const pollInterval = setInterval(() => {
            fetchMessages();
        }, 3000);

        // 3. Keep the socket listener for instant updates if the backend fixes it
        const handleIncomingMessage = (payload: any) => {
            console.log("🟢 [WebSocket] Real-time message detected, triggering fetch...");
            fetchMessages(); 
        };

        if (socket) socket.on("new_message", handleIncomingMessage);

        return () => {
            clearInterval(pollInterval);
            if (socket) socket.off("new_message", handleIncomingMessage);
        };
    }, [activeChatId, socket, isConnected]); 

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const messageToSend = newMessage.trim();
        setNewMessage("");

        try {
            // Ensure payload exactly matches backend expectations with uppercase TEXT
            const payload = {
                type: "TEXT", 
                content: messageToSend
            };

            console.log(`🔵 [API Request] POST /messages/${activeChatId} PAYLOAD:`, payload);

            const res = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json", 
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                console.log("🟢 [API Response] POST /messages SUCCESS");
                // Immediately trigger a fetch so the sender sees their message instantly
                fetchMessages(); 
            } else {
                const errText = await res.text();
                console.error("🔴 [API Error] POST /messages FAILED:", errText);
                setNewMessage(messageToSend); 
                showToast("Failed to send message. Check console.", "error");
            }
        } catch (error) {
            console.error("🔴 [Network Error] POST /messages crashed:", error);
            setNewMessage(messageToSend); 
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChatId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsUploadingFile(true);
        
        let type = "DOCUMENT";
        if (file.type.startsWith("image/")) type = "IMAGE";
        if (file.type.startsWith("video/")) type = "VIDEO";

        const formData = new FormData();
        formData.append("type", type);
        formData.append("content", ""); 
        formData.append("file", file); 

        try {
            console.log(`🔵 [API Request] POST /messages/${activeChatId} (File) | Sent: FormData`);
            const msgRes = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (msgRes.ok) {
                console.log("🟢 [API Response] POST /messages (File) SUCCESS");
                fetchMessages(); // Trigger UI update
            } else {
                const errData = await msgRes.json().catch(() => null);
                console.error(`🔴 [API Error] POST /messages (File) FAILED: Status ${msgRes.status}`, errData || msgRes.statusText);
                throw new Error(errData?.message || errData?.error || `Server responded with status ${msgRes.status}`);
            }
        } catch (error: any) {
            console.error("🔴 [Network Error] File upload process crashed:", error);
            showToast(error.message || "An error occurred during file upload", "error");
        } finally {
            setIsUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    const handlePaymentSubmit = async () => {
        if (!paymentAmount || isNaN(Number(paymentAmount)) || !activeConversation || !activeChatId) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsProcessingPayment(true);

        try {
            const payload = {
                creatorId: activeConversation.userId, 
                amount: Number(paymentAmount)
            };

            console.log("🔵 [API Request] POST /payments/pay PAYLOAD:", payload);
            const res = await fetch(`${BASE_URL}/payments/pay`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                console.log("🟢 [API Response] POST /payments/pay SUCCESS:", data);

                const authUrl = data.paymentUrl || data.data?.authorization_url;
                const reference = data.reference || data.data?.reference;

                if (authUrl && reference) {
                    
                    try {
                        const messageContent = `Payment initiated successfully. Reference ID: ${reference}`;
                        const automatedPayload = { type: "TEXT", content: messageContent }; 

                        console.log(`🔵 [API Request] POST /messages/${activeChatId} (Automated Reference) PAYLOAD:`, automatedPayload);
                        
                        const msgRes = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json",
                                "Accept": "application/json",
                                "Authorization": `Bearer ${token}` 
                            },
                            body: JSON.stringify(automatedPayload) 
                        });

                        if (msgRes.ok) {
                            console.log("🟢 [API Response] POST /messages (Automated Reference) SUCCESS");
                        } else {
                            console.error("🔴 [API Error] POST /messages (Automated Reference) FAILED:", await msgRes.text());
                        }
                    } catch (msgError) {
                        console.error("🔴 [Network Error] Failed to send automated reference message:", msgError);
                    }

                    console.log("🔵 [Redirect] Redirecting user to Paystack checkout:", authUrl);
                    window.location.href = authUrl;

                } else {
                    console.error("🔴 [API Error] Missing authorization_url or reference in response:", data);
                    alert("Payment initialized, but checkout link or reference was missing from server.");
                    setIsProcessingPayment(false);
                }
            } else {
                console.error("🔴 [API Error] POST /payments/pay FAILED:", await res.text());
                alert("Payment failed to initialize.");
                setIsProcessingPayment(false);
            }
        } catch (error) {
            console.error("🔴 [Network Error] POST /payments/pay crashed:", error);
            alert("Network error during payment.");
            setIsProcessingPayment(false);
        }
    };

    const numericAmount = Number(paymentAmount);
    const platformFee = isNaN(numericAmount) ? 0 : numericAmount * 0.10;
    const totalAmount = isNaN(numericAmount) ? 0 : numericAmount + platformFee;

    return (
        <div className={`h-screen w-full flex flex-col bg-[#F8F9FB] ${inter.className} overflow-hidden`}>
            
            <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast(prev => ({...prev, isVisible: false}))} />
            <NavigationPill />

            <main className="flex-1 flex flex-col min-h-0 w-full max-w-[90rem] mx-auto px-4 md:px-8 pb-10 md:pb-6 pt-[140px] md:pt-[120px]">
                
                <h1 className="sr-only">Business Messages and Campaign Management</h1>

                <div className="flex-1 h-full bg-white rounded-[2rem] shadow-md shadow-gray-200/40 border border-gray-100 flex w-full min-h-0 overflow-hidden relative">
                    
                    {/* --- LEFT PANEL --- */}
                    <div className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r border-gray-100 bg-[#FDFDFD] h-full ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-6 pb-2 shrink-0">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search here" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white rounded-full py-3 pl-11 pr-4 text-sm text-gray-700 placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" 
                                />
                            </div>
                        </div>
                        
                        <div className="px-6 pt-4 mb-2 flex justify-between items-center shrink-0">
                            <h2 className="text-gray-900 font-bold text-lg">Conversations</h2>
                            {globalUnreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {globalUnreadCount} New
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {loadingConversations ? (
                                <div className="p-4 text-center text-gray-400 text-sm animate-pulse">Loading chats...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No matches found.</div>
                            ) : (
                                filteredConversations.map((chat) => {
                                    const name = getCreatorName(chat);
                                    const initial = getInitial(name);
                                    const isActive = activeChatId === chat.conversationId;
                                    return (
                                        <div key={chat.conversationId} onClick={() => handleChatSelect(chat.conversationId)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isActive ? "bg-indigo-50" : "hover:bg-gray-50 bg-transparent"}`}>
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 relative shrink-0 bg-indigo-100 flex items-center justify-center">
                                                {chat.avatar ? (
                                                    <Image src={chat.avatar} alt={name} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-[#5B4DFF] font-bold text-lg">{initial}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline"><h3 className={`font-bold text-sm truncate ${isActive ? "text-[#5B4DFF]" : "text-gray-900"}`}>{name}</h3></div>
                                            </div>
                                        </div>
                                    ); 
                                })
                            )}
                        </div>
                    </div>

                    {/* --- CENTER PANEL --- */}
                    <div className={`flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                        {activeChatId && activeConversation ? (
                            <>
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <button onClick={handleBackToList} className="md:hidden p-1 -ml-2 text-gray-600"><ArrowLeftIcon className="w-5 h-5" /></button>
                                        <div className="w-10 h-10 rounded-full overflow-hidden relative border border-gray-100 shrink-0 bg-indigo-100 flex items-center justify-center">
                                            {activeConversation.avatar ? (
                                                <Image src={activeConversation.avatar} alt="C" fill className="object-cover" />
                                            ) : (
                                                <span className="text-[#5B4DFF] font-bold text-base">{getInitial(getCreatorName(activeConversation))}</span>
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{getCreatorName(activeConversation)}</h2>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        
                                        <button 
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="bg-[#D1F7C4] hover:bg-[#bbf0aa] text-[#0A4D36] font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                        >
                                            Pay Creator
                                        </button>
                                        
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                    <div className="flex justify-center mb-6"><span className="bg-indigo-50 text-[#5B4DFF] text-xs font-bold px-3 py-1 rounded-full">Today</span></div>
                                    {initialLoadingMessages ? (
                                        <div className="flex justify-center mt-10"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : messages.map((msg) => {
                                        const sentByMe = isMe(msg);
                                        return (
                                            <div key={msg.id} className={`flex items-end gap-2 ${sentByMe ? "justify-end" : "justify-start"}`}>
                                                {!sentByMe && (
                                                    <div className="w-8 h-8 rounded-full overflow-hidden relative bg-indigo-100 shrink-0 mb-4 border border-gray-100 flex items-center justify-center">
                                                        {activeConversation.avatar ? (
                                                            <Image src={activeConversation.avatar} alt="C" fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-[#5B4DFF] font-bold text-xs">{getInitial(getCreatorName(activeConversation))}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-col max-w-[75%] md:max-w-[65%]">
                                                    
                                                    <div className={`px-5 py-3 text-sm leading-relaxed shadow-sm break-words ${sentByMe ? "bg-[#5B4DFF] text-white rounded-2xl rounded-br-none" : "bg-[#F3F4F6] text-gray-900 rounded-2xl rounded-bl-none"}`}>
                                                        
                                                        {msg.type === "IMAGE" && msg.fileUrl && (
                                                            <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-white/20 mb-2">
                                                                <Image src={msg.fileUrl} alt={msg.fileName || "Uploaded image"} fill className="object-cover" />
                                                            </div>
                                                        )}

                                                        {msg.type === "VIDEO" && msg.fileUrl && (
                                                            <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-white/20 mb-2">
                                                                <video src={msg.fileUrl} controls className="w-full h-auto bg-black" />
                                                            </div>
                                                        )}

                                                        {msg.type === "DOCUMENT" && msg.fileUrl && (
                                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline font-semibold hover:text-opacity-80 transition-opacity text-current mb-2 bg-black/10 p-3 rounded-lg">
                                                                <DocumentTextIcon className="w-5 h-5 shrink-0" />
                                                                <span className="truncate">{msg.fileName || "View Document"}</span>
                                                            </a>
                                                        )}

                                                        {msg.content && (
                                                            <span>{msg.content}</span>
                                                        )}
                                                    </div>

                                                    <span className={`text-[10px] text-gray-400 mt-1 ${sentByMe ? "text-right" : "text-left"}`}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
                                    <div className="bg-[#F8F9FB] rounded-2xl px-2 py-2 flex items-center gap-2 border border-gray-100 focus-within:border-indigo-300 transition-colors shadow-sm">
                                        
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileUpload} 
                                            className="hidden" 
                                            disabled={isUploadingFile}
                                        />
                                        
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingFile}
                                            className="p-2 text-gray-400 hover:text-[#5B4DFF] transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                                        >
                                            {isUploadingFile ? (
                                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <PaperClipIcon className="w-5 h-5 cursor-pointer" />
                                            )}
                                        </button>
                                        
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }} placeholder="Type a message" className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400" />
                                        <button onClick={(e) => { e.preventDefault(); handleSendMessage(); }} disabled={!newMessage.trim()} className="bg-[#5B4DFF] p-2.5 rounded-xl text-white hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:shadow-none cursor-pointer"><PaperAirplaneIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><PaperAirplaneIcon className="w-8 h-8 text-gray-300 -ml-1 mt-1" /></div>
                                <p className="text-gray-500 font-medium">Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- PAYMENT MODAL OVERLAY --- */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white border border-gray-800">
                        
                        <button 
                            onClick={() => {
                                setIsPaymentModalOpen(false);
                                setPaymentAmount(""); 
                            }}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col mt-2">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                <BanknotesIcon className="w-8 h-8 text-emerald-400" />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">Fund Escrow</h2>
                            <p className="text-sm text-gray-400 mb-8">
                                Enter the amount you wish to pay <span className="text-white font-semibold">{getCreatorName(activeConversation)}</span>.
                            </p>

                            <div className="mb-6 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                <input 
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-4 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                                />
                            </div>

                            <div className="space-y-3 mb-8 bg-[#151515] p-4 rounded-xl border border-gray-800/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Amount</span>
                                    <span className="font-mono">₦{numericAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-1">Platform Fee <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">10%</span></span>
                                    <span className="font-mono text-gray-400">₦{platformFee.toLocaleString()}</span>
                                </div>
                                <div className="h-px w-full bg-gray-800 my-2"></div>
                                <div className="flex justify-between text-base font-bold text-emerald-400">
                                    <span>Total to Pay</span>
                                    <span className="font-mono">₦{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handlePaymentSubmit}
                                disabled={isProcessingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isProcessingPayment ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Proceed to Payment"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}