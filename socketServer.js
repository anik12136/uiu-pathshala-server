// socketServer.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Create an Express app
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Create a Socket.IO instance attached to the server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (for testing purposes)
    methods: ["GET", "POST"],
  },
});

// Socket.IO Logic
const onlineUsers = new Map(); // Track online users (email -> socket ID)

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for user online event
  socket.on("user-online", (email) => {
    console.log(`${email} is online`);
    onlineUsers.set(email, socket.id);

    // Broadcast the updated list of online users to all clients
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  // Listen for user sending a message
  socket.on("send-message", (data) => {
    const { recipient, content, timestamp, sender } = data;

    console.log(data);
    // Check if the recipient is online
    if (onlineUsers.has(recipient)) {
      const recipientSocketId = onlineUsers.get(recipient);

      // Emit the message directly to the recipient
      io.to(recipientSocketId).emit("new-message", {
        sender,
        content,
        timestamp,
      });
    } else {
      console.log(`${recipient} is offline`);
      // Optionally, notify the sender that the recipient is offline
      socket.emit("message-failed", {
        recipient,
        message: "User is offline",
      });
    }
  });

  // Listen for user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove the user from the online users list
    for (const [email, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(email);

        // Broadcast the updated list of online users to all clients
        io.emit("online-users", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

// Start the server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Socket server is running on http://localhost:${PORT}`);
});
