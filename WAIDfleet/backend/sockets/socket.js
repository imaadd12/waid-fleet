// backend/sockets/socket.js
const { Server } = require("socket.io");
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Example: Driver status update
    socket.on("driver:status", (data) => {
      // Broadcast to admins
      io.emit("admin:driver-status", data);
    });

    // Example: Live location update
    socket.on("driver:location", (data) => {
      io.emit("admin:driver-location", data);
    });

    // Example: Trip events
    socket.on("driver:route-start", (data) => {
      io.emit("admin:route-start", data);
    });
    socket.on("driver:route-end", (data) => {
      io.emit("admin:route-end", data);
    });

    // Example: Geofence alert
    socket.on("alert:geofence", (data) => {
      io.emit("admin:geofence-alert", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };