import { NextRequest } from "next/server";
import { Server as HTTPServer } from "http";
import { Socket as ServerSocket, Server as SocketIOServer } from "socket.io";

declare global {
  var socketServer: SocketIOServer | undefined;
}

const userSockets = new Map<string, Set<string>>();

export async function GET(req: NextRequest) {
  return new Response("Socket.IO server is running", { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, userId, data } = body;

  if (!globalThis.socketServer) {
    return new Response(JSON.stringify({ error: "Socket server not initialized" }), { status: 503 });
  }

  if (action === "notify") {
    if (userId && globalThis.socketServer) {
      globalThis.socketServer.to(userId).emit("notification:new", data);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
