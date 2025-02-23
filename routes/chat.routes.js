const express = require("express");
const {
  getAllConversations,
  sendMessage,
  getMessages,
  markConversationAsRead,
  searchUsers,
} = require("../controllers/chat.controller");
const router = express.Router();


// Route for creating a conversation
router.get("/conversations/:email", getAllConversations);
router.post("/message", sendMessage);
router.get("/messages/:conversationId", getMessages);
router.patch("/markRead", markConversationAsRead);
router.get("/user/:query", searchUsers);

// router.post("/conversations", getOrCreateConversation);
// router.get("/conversations", getConversations);
// router.post("/messages", sendMessage);

module.exports = router;
