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
    InformationCircleIcon,
    BanknotesIcon
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
    businessName?: string;
    profileImageUrl?: string;
    user?: User; 
}

interface Creator {
    id: string;
    email?: string;
    avatar?: string | null; 
}

// CHANGED: Updated to match new backend response
interface Conversation {
    conversationId: string;
    userId: string;
    avatar: string | null;
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

export default function BusinessMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null); 
    
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); 
    
    // --- PAYMENT MODAL STATES ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
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

    // --- 2. FETCH MESSAGES (POLLING) ---
    useEffect(() => {
        if (!activeChatId) return;

        const fetchMessages = async (isBackground = false) => {
            if (!isBackground) setInitialLoadingMessages(true);
            
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            try {
                if (!isBackground) console.log(`🔵 [API Request] GET /messages/${activeChatId}`);
                const res = await fetch(`${BASE_URL}/messages/${activeChatId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (!isBackground) console.log(`🟢 [API Response] GET /messages/${activeChatId} SUCCESS:`, data);
                    
                    const sorted = data.sort((a: Message, b: Message) => 
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                    setMessages(sorted);
                } else {
                    if (!isBackground) console.error(`🔴 [API Error] GET /messages/${activeChatId} FAILED:`, await res.text());
                }

                // Mark as read silently
                if (!isBackground) console.log(`🔵 [API Request] PATCH /messages/read/${activeChatId}`);
                const readRes = await fetch(`${BASE_URL}/messages/read/${activeChatId}`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (readRes.ok) {
                    if (!isBackground) console.log(`🟢 [API Response] PATCH /messages/read/${activeChatId} SUCCESS`);
                } else {
                    if (!isBackground) console.error(`🔴 [API Error] PATCH /messages/read/${activeChatId} FAILED:`, await readRes.text());
                }

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

            console.log("🔵 [API Request] POST /messages PAYLOAD:", payload);
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
                console.log("🟢 [API Response] POST /messages SUCCESS:", savedMessage);
                setMessages(prev => [...prev, savedMessage]);
                scrollToBottom();
            } else {
                console.error("🔴 [API Error] POST /messages FAILED:", await res.text());
                setNewMessage(messageToSend); 
            }
        } catch (error) {
            console.error("🔴 [Network Error] POST /messages crashed:", error);
            setNewMessage(messageToSend); 
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // CHANGED: Update lookup to use the new conversationId
    const activeConversation = conversations.find(c => c.conversationId === activeChatId);

    // --- 4. HANDLE PAYMENT LOGIC ---
    const handlePaymentSubmit = async () => {
        if (!paymentAmount || isNaN(Number(paymentAmount)) || !activeConversation) return;

        const token = localStorage.getItem("accessToken");
        if (!token) return;

        setIsProcessingPayment(true);

        try {
            const payload = {
                creatorId: activeConversation.userId, // CHANGED: Using userId from the new data structure
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

                if (authUrl) {
                    console.log("🔵 [Redirect] Redirecting user to Paystack checkout:", authUrl);
                    window.location.href = authUrl;
                } else {
                    console.error("🔴 [API Error] Missing authorization_url in response:", data);
                    alert("Payment initialized, but checkout link was missing from server.");
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


    // CHANGED: Since we lost the business details on the conversation object, if the sender is NOT the creator we are chatting with, we assume it's "me"
    const isMe = (msg: Message) => {
        if (!activeConversation) return false;
        const senderId = msg?.sender?.id;
        if (!senderId) return false;
        
        return senderId !== activeConversation.userId;
    };

    // CHANGED: Fallback name generator since email/username is no longer in the payload
    const getCreatorName = (conv?: Conversation) => {
        if (!conv || !conv.userId) return "Creator";
        return `User ${conv.userId.substring(0, 4)}`; // Will show like "User 4841"
    };

    const getInitial = (nameFallback?: string) => {
        if (!nameFallback) return "C";
        return nameFallback.charAt(0).toUpperCase();
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
            
            <NavigationPill />

            {/* CHANGED: Adjusted pt and pb values here for desktop/mobile consistency with the creator side */}
            <main className="flex-1 flex flex-col min-h-0 w-full max-w-[90rem] mx-auto px-4 md:px-8 pb-10 md:pb-6 pt-[140px] md:pt-[120px]">
                
                <div className="flex-1 h-full bg-white rounded-[2rem] shadow-md shadow-gray-200/40 border border-gray-100 flex w-full min-h-0 overflow-hidden relative">
                    
                    {/* --- LEFT PANEL --- */}
                    <div className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r border-gray-100 bg-[#FDFDFD] h-full ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-6 pb-2 shrink-0">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input type="text" placeholder="Search here" className="w-full bg-white rounded-full py-3 pl-11 pr-4 text-sm text-gray-700 placeholder-gray-400 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                            </div>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2 px-6 pt-4 shrink-0">Conversations</h3>
                        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                            {loadingConversations ? (
                                <div className="p-4 text-center text-gray-400 text-sm animate-pulse">Loading chats...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No conversations yet.</div>
                            ) : (
                                conversations.map((chat) => {
                                    const name = getCreatorName(chat);
                                    const initial = getInitial(name);
                                    // CHANGED: Using conversationId for keys and active state
                                    const isActive = activeChatId === chat.conversationId;
                                    return (
                                        <div key={chat.conversationId} onClick={() => handleChatSelect(chat.conversationId)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isActive ? "bg-indigo-50" : "hover:bg-gray-50 bg-transparent"}`}>
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 relative shrink-0 bg-indigo-100 flex items-center justify-center">
                                                {/* CHANGED: Using new avatar path */}
                                                {chat.avatar ? (
                                                    <Image src={chat.avatar} alt={name} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-[#5B4DFF] font-bold text-lg">{initial}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline"><h4 className={`font-bold text-sm truncate ${isActive ? "text-[#5B4DFF]" : "text-gray-900"}`}>{name}</h4></div>
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
                                            {/* CHANGED: Updated Avatar mapping */}
                                            {activeConversation.avatar ? (
                                                <Image src={activeConversation.avatar} alt="C" fill className="object-cover" />
                                            ) : (
                                                <span className="text-[#5B4DFF] font-bold text-base">{getInitial(getCreatorName(activeConversation))}</span>
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{getCreatorName(activeConversation)}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={`p-2 rounded-full transition-colors ${isDetailsOpen ? 'bg-indigo-50 text-[#5B4DFF]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}><InformationCircleIcon className="w-6 h-6" /></button>
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
                                                        {/* CHANGED: Updated Avatar mapping */}
                                                        {activeConversation.avatar ? (
                                                            <Image src={activeConversation.avatar} alt="C" fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-[#5B4DFF] font-bold text-xs">{getInitial(getCreatorName(activeConversation))}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-col max-w-[75%] md:max-w-[65%]">
                                                    <div className={`px-5 py-3 text-sm leading-relaxed shadow-sm break-words ${sentByMe ? "bg-[#5B4DFF] text-white rounded-2xl rounded-br-none" : "bg-[#F3F4F6] text-gray-900 rounded-2xl rounded-bl-none"}`}>{msg.content}</div>
                                                    <span className={`text-[10px] text-gray-400 mt-1 ${sentByMe ? "text-right" : "text-left"}`}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
                                    <div className="bg-[#F8F9FB] rounded-2xl px-2 py-2 flex items-center gap-2 border border-gray-100 focus-within:border-indigo-300 transition-colors shadow-sm">
                                        <button className="p-2 text-gray-400 hover:text-[#5B4DFF] transition-colors rounded-full hover:bg-gray-100"><PaperClipIcon className="w-5 h-5" /></button>
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

                        <div className="bg-[#EBE9FE] w-full aspect-[4/5] rounded-3xl flex flex-col items-center justify-center text-[#5B4DFF] mb-auto shrink-0">
                            <DocumentTextIcon className="w-16 h-16 mb-4 opacity-80" />
                            <span className="text-sm font-bold">Brief Preview</span>
                        </div>

                        <div className="w-full bg-[#E8FBE3]/60 rounded-2xl p-5 text-center mt-6 border border-[#D1F7C4] shrink-0">
                            <div className="flex items-center justify-center gap-1.5 text-[#00D68F] text-xs font-bold mb-4 uppercase tracking-wide">
                                <ShieldCheckIcon className="w-4 h-4" /> Escrow Ready
                            </div>
                            <button 
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="w-full bg-[#D1F7C4] hover:bg-[#bbf0aa] text-[#0A4D36] font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                            >
                                Pay Creator
                            </button>
                        </div>
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