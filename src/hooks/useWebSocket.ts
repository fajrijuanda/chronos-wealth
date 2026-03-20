"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useWebSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize Socket.IO connection
    const socket = io(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      socket.emit("user:join", userId);
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const subscribeToNotifications = useCallback(
    (callback: (notification: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("notification:new", callback);
        return () => {
          socketRef.current?.off("notification:new", callback);
        };
      }
    },
    []
  );

  const subscribeToCollaboration = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("collaboration:update", callback);
        return () => {
          socketRef.current?.off("collaboration:update", callback);
        };
      }
    },
    []
  );

  const subscribeFriendship = useCallback(
    (callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on("friendship:status", callback);
        return () => {
          socketRef.current?.off("friendship:status", callback);
        };
      }
    },
    []
  );

  return {
    socket: socketRef.current,
    subscribeToNotifications,
    subscribeToCollaboration,
    subscribeFriendship,
  };
}
