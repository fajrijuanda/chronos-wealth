"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useStatus } from "@/components/providers/StatusProvider";

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onNotification: (userId: string, callback: (data: any) => void) => void;
  offNotification: (userId: string, callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children, email }: { children: React.ReactNode; email: string | null }) {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const { showSuccess } = useStatus();

  useEffect(() => {
    if (!email) return;

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      isConnectedRef.current = true;
      socket.emit("user:join", email);
    });

    socket.on("notification:new", (notification: any) => {
      console.log("[WebSocket] New notification:", notification);
      showSuccess(notification.body, notification.title);
    });

    socket.on("friendship:status", (data: any) => {
      console.log("[WebSocket] Friendship status update:", data);
      showSuccess(`Status: ${data.status}`, "Friendship Update");
    });

    socket.on("collaboration:update", (data: any) => {
      console.log("[WebSocket] Collaboration update:", data);
    });

    socket.on("user:online", (data: any) => {
      console.log("[WebSocket] User online:", data.userId);
    });

    socket.on("user:offline", (data: any) => {
      console.log("[WebSocket] User offline:", data.userId);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      isConnectedRef.current = false;
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [email, showSuccess]);

  const onNotification = useCallback(
    (userId: string, callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on(`notification:${userId}`, callback);
      }
    },
    []
  );

  const offNotification = useCallback(
    (userId: string, callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.off(`notification:${userId}`, callback);
      }
    },
    []
  );

  return (
    <WebSocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected: isConnectedRef.current,
        onNotification,
        offNotification,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}
