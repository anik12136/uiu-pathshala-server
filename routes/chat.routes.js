const express = require("express");
const {
  getAllConversations,
  sendMessage,
  getMessages,
  markConversationAsRead,
} = require("../controllers/chat.controller");
const router = express.Router();


// Route for creating a conversation
router.get("/conversations/:email", getAllConversations);
router.post("/message", sendMessage);
router.get("/messages/:conversationId", getMessages);
router.patch("/conversation/markRead", markConversationAsRead);

// router.post("/conversations", getOrCreateConversation);
// router.get("/conversations", getConversations);
// router.post("/messages", sendMessage);

module.exports = router;
