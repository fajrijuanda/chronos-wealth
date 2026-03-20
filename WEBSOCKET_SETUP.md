# WebSocket Real-Time Notifications Implementation

## Overview
Real-time notifications menggunakan Socket.io telah berhasil diimplementasikan. Sistem ini memungkinkan notifikasi instant ditampilkan kepada user tanpa perlu refresh halaman.

## Setup yang Telah Dilakukan

### 1. **Instalasi Dependencies**
```bash
npm install socket.io socket.io-client
npm install --save-dev tsx
```

### 2. **File-File Baru yang Ditambahkan**

#### a. `server.ts` - Custom HTTP Server dengan Socket.io
- Menjalankan Next.js dengan Socket.io attached
- Menangani koneksi user dan room management
- Events yang didukung:
  - `user:join` - User bergabung ke channel
  - `user:online` / `user:offline` - Status online/offline
  - `notification:send` - Broadcast notifikasi
  - `friendship:status` - Update status pertemanan
  - `collaboration:update` - Update kolaborasi

#### b. `src/components/providers/WebSocketProvider.tsx`
- Context provider untuk WebSocket
- Auto-connect saat app mount
- Listen semua notification events
- Terintegrasi dengan StatusProvider untuk UI feedback

#### c. `src/hooks/useWebSocket.ts`
- Hook untuk koneksi WebSocket
- Support subscribe ke berbagai event types

#### d. `src/app/api/socket/route.ts`
- API endpoint untuk server-side notification emission

### 3. **File-File yang Diupdate**

#### a. `package.json`
- Script `dev`: `tsx watch server.ts` (run custom server)
- Script `start`: `node -r tsx/cjs server.ts`

#### b. `.env`
```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INTERNAL_API_URL="http://localhost:3000/api/socket"
```

#### c. `src/actions/notification.ts`
- Setiap kali notifikasi dibuat, otomatis di-emit via WebSocket ke user yang dituju

## Cara Menggunakan

### 1. **Wrap App dengan WebSocketProvider** (jika belum)
Di layout root atau dashboard layout:
```tsx
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";
import { getActiveUserEmail } from "@/lib/active-user";

export default async function Layout({ children }) {
  const email = await getActiveUserEmail();
  
  return (
    <WebSocketProvider email={email}>
      {children}
    </WebSocketProvider>
  );
}
```

### 2. **Notifikasi Akan Otomatis Real-time**
Ketika `createUserNotification()` dipanggil di server:
```tsx
await createUserNotification({
  userId: user.id,
  type: NotificationType.FRIENDSHIP_REQUEST,
  title: "Friendship Request",
  body: "User X mengirim friendship request",
});
```

User akan langsung menerima notifikasi via WebSocket (tidak perlu refresh).

### 3. **Listen Custom Events** (opsional)
```tsx
"use client";
import { useWebSocketContext } from "@/components/providers/WebSocketProvider";
import { useEffect } from "react";

export function MyComponent() {
  const { socket } = useWebSocketContext();

  useEffect(() => {
    socket?.on("custom:event", (data) => {
      console.log("Received:", data);
    });
  }, [socket]);

  return <div>...</div>;
}
```

## Features yang Sudah Terintegrasi

✅ **Notification Real-Time**
- Notifikasi masuk langsung ditampilkan
- Terintegrasi dengan StatusProvider

✅ **User Presence**
- Track user online/offline
- Multiple tabs support

✅ **Friendship Status Updates**
- Real-time pertemanan status changes

✅ **Collaboration Updates**
- Real-time booth proposal updates

## Environment Variables

```env
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000    # Frontend URL
INTERNAL_API_URL=http://localhost:3000/api/socket  # Server-side API endpoint

# Optional (default: http://localhost:3000)
PORT=3000
NODE_ENV=production
```

## Cara Menjalankan

**Development:**
```bash
npm run dev
```
Server akan berjalan dengan Socket.io pada port 3000

**Production:**
```bash
npm run build
npm start
```

## Testing WebSocket

1. Buka app di browser: `http://localhost:3000`
2. Login dengan user A
3. Di tab lain, login dengan user B
4. User A mengirim friendship request ke user B
5. User B akan menerima notifikasi **instantly** tanpa refresh

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (App Router)   │
└────────┬────────┘
         │
         │ (Socket.io Client)
         ↓
┌─────────────────────────────┐
│    Custom HTTP Server       │
│    (server.ts with io)      │
│                             │
│  ├─ /api/* (Next.js routes) │
│  └─ Socket.io Server        │
│     ├─ Connection handling  │
│     ├─ Room management      │
│     └─ Event broadcasting   │
└─────────────────────────────┘
         ↑
         │ (Server Actions)
         │ (createUserNotification)
    Database
```

## Notes

- Socket.io auto-reconnect diaktifkan dengan exponential backoff
- Default reconnection delay: 1s, max: 5s, attempts: 10
- CORS sudah dikonfigurasi untuk development dan production
- Error handling: Jika server tidak tersedia, notifikasi tetap disimpan di database

## Next Steps (Optional)

1. **Notifications Badge Count** - Track unread notifications
2. **Typing Indicators** - Show "User is typing..."
3. **Collaborative Features** - Real-time booth booth updates
4. **Analytics** - Track notification delivery rates
5. **Persistence** - Store offline messages di queue
