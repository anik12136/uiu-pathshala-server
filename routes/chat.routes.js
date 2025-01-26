const express = require("express");
const {
  createConversation,
  getAllConversations,
  sendMessage,
  getMessages,
  markAsRead,
} = require("../controllers/chat.controller");
const router = express.Router();


// Route for creating a conversation
router.post("/create", createConversation);
router.get("/conversations/:email", getAllConversations);
router.post("/message", sendMessage);
router.get("/messages/:conversationId", getMessages);
router.patch("/conversation/:conversationId/read", markAsRead);

// router.post("/conversations", getOrCreateConversation);
// router.get("/conversations", getConversations);
// router.post("/messages", sendMessage);

module.exports = router;
