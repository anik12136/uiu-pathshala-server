const connectDB = require("./db");

async function initializeSocket(io) {
  const onlineUsers = new Map(); // email -> { name }
  const db = await connectDB();
  const conversations = db.collection("conversations");

  io.on("connection", (socket) => {

    
    const { email } = socket.handshake.query; // Email and name passed during connection


    if (!email) {
      console.error("Connection missing email or name");
      return;
    }
    console.log("connected:",email);
    
    // Add user to the map
    onlineUsers.set(email);

    // Broadcast updated online users list
    io.emit("onlineUsers", Array.from(onlineUsers.entries()));

    console.log(` (${email}) connected.`);

    // Handle disconnect
    socket.on("disconnect", () => {
      if (email) {
        onlineUsers.delete(email);

        // Broadcast updated online users list
        io.emit("onlineUsers", Array.from(onlineUsers.entries()));

        console.log(`(${email}) disconnected.`);
      }
    });
  });
}

module.exports = initializeSocket;
