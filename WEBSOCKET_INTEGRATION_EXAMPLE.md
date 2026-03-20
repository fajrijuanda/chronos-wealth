// Example: How to integrate WebSocket into your dashboard layout
// File: src/app/(dashboard)/layout.tsx

"use client";

import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import { getActiveUserEmail } from "@/lib/active-user";

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get logged-in user email
  const email = await getActiveUserEmail();

  return (
    <WebSocketProvider email={email}>
      {/* Your existing layout content */}
      {children}
    </WebSocketProvider>
  );
}

// ============================================================
// Example: Using WebSocket in a component
// ============================================================

// src/app/(dashboard)/collaboration/page.tsx
"use client";

import { useWebSocketContext } from "@/components/providers/WebSocketProvider";
import { useEffect } from "react";

export function CollaborationPage() {
  const { socket, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!socket) return;

    // Listen for friendship status updates
    socket.on("friendship:status", (data) => {
      console.log("Friendship status changed:", data);
      // Trigger page revalidation or state update
    });

    // Listen for collaboration updates
    socket.on("collaboration:update", (data) => {
      console.log("Collaboration updated:", data);
    });

    return () => {
      socket.off("friendship:status");
      socket.off("collaboration:update");
    };
  }, [socket]);

  return (
    <div>
      <p>
        WebSocket Status:{" "}
        {isConnected ? (
          <span className="text-green-600">Connected ✓</span>
        ) : (
          <span className="text-red-600">Disconnected ✗</span>
        )}
      </p>
      {/* Your collaboration content */}
    </div>
  );
}

// ============================================================
// Example: Server Action with Real-time Notification
// ============================================================

// src/actions/collaboration.ts
import { createUserNotification } from "@/actions/notification";
import { NotificationType } from "@prisma/client";

export async function acceptFriendshipRequest(requestId: string) {
  // ... your logic

  // This notification will be sent REAL-TIME via WebSocket
  await createUserNotification({
    userId: friendUserId,
    type: NotificationType.FRIENDSHIP_ACCEPTED,
    title: "Friendship Accepted",
    body: `${yourName} accepted your friendship request!`,
    href: "/profile",
  });
}

// ============================================================
// Important Notes:
// ============================================================

/*
1. WebSocketProvider must be placed in a client component or async server component
2. All children of WebSocketProvider can use useWebSocketContext hook
3. Notifications are automatically shown via StatusProvider integration
4. Socket connection happens automatically on mount
5. Disconnection handling is automatic on unmount
6. Multiple tabs/windows support built-in
*/
