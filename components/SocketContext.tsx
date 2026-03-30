"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        // Initialize the Socket.io connection
        const socketInstance = io(SOCKET_URL, {
            auth: {
                token: token // This is the standard way Socket.io expects JWTs
            },
            transports: ["websocket"], // Force websocket to bypass long-polling
            reconnection: true, // Socket.io handles auto-reconnecting automatically!
        });

        socketInstance.on("connect", () => {
            console.log("🟢 [WebSocket] Connected to Socket.io server:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("connect_error", (err) => {
            console.error("🔴 [WebSocket] Connection error:", err.message);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log(`🔴 [WebSocket] Disconnected. Reason: ${reason}`);
            setIsConnected(false);
        });

        setSocket(socketInstance);

        // Cleanup function to close connection when user leaves the app entirely
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};