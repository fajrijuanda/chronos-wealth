import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import next from "next";

declare global {
  var socketServer: SocketIOServer | undefined;
}

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || "3000", 10);

const io = new SocketIOServer({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSockets = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log("[Socket.IO] Client connected:", socket.id);

  socket.on("user:join", (userId: string) => {
    if (!userId) return;
    socket.join(userId);
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)?.add(socket.id);
    console.log(`[Socket.IO] User ${userId} joined`);
    io.emit("user:online", { userId, count: userSockets.get(userId)?.size });
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO] Client disconnected:", socket.id);
    userSockets.forEach((sockets, userId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          io.emit("user:offline", { userId });
        }
      }
    });
  });

  socket.on("notification:send", (data: { userId: string; notification: any }) => {
    io.to(data.userId).emit("notification:new", data.notification);
  });

  socket.on("collaboration:update", (data: any) => {
    io.emit("collaboration:update", data);
  });

  socket.on("friendship:status", (data: { userId: string; status: string }) => {
    io.to(data.userId).emit("friendship:status", data);
  });
});

global.socketServer = io;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  io.attach(server);

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
