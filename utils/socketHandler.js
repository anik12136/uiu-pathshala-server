module.exports = function initializeSocket(io) {
  // Track online users using a Map (email -> socket ID)
  const onlineUsers = new Map();
  console.log("TEST");

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
      const { recipient, content, sender } = data;

      // Check if the recipient is online
      if (onlineUsers.has(recipient)) {
        const recipientSocketId = onlineUsers.get(recipient);

        // Emit the message directly to the recipient
        io.to(recipientSocketId).emit("new-message", {
          sender,
          content,
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
};
