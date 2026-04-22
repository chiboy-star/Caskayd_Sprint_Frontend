"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { usePathname } from "next/navigation";

// Extract the domain without the /api path if your socket server runs on the root domain
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const SOCKET_URL = BASE_URL.replace("/api", ""); 

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // We listen to the pathname so we can check for a token after login redirects
    const pathname = usePathname();
    
    // Use a ref to hold the connection to prevent endless re-renders/re-connections
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        // 1. User is logged out: Kill the connection if it exists
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // 2. User is logged in, but no socket exists yet: Create it!
        if (token && !socketRef.current) {
            const socketInstance = io(SOCKET_URL, {
                // We pass the token in every format backends typically look for
                auth: { token: token, Authorization: `Bearer ${token}` },
                query: { token: token },
                extraHeaders: { Authorization: `Bearer ${token}` },
                transports: ["websocket"], 
                reconnection: true, 
            });

            socketInstance.on("connect", () => {
                setIsConnected(true);
            });

            socketInstance.on("disconnect", () => {
                setIsConnected(false);
            });

            socketRef.current = socketInstance;
            setSocket(socketInstance);
        }
    }, [pathname]); // Runs the check every time the URL changes

    // Final cleanup only when the entire app unmounts
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};