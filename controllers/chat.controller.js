const connectDB = require("../utils/db");


const createConversation = async (req, res) => {
  const { userEmail, targetEmail } = req.body;

  if (!userEmail || !targetEmail) {
    return res
      .status(400)
      .json({ error: "Both userEmail and targetEmail are required" });
  }

  try {
    const db = getDb();
    const conversationsCollection = db.collection("conversations");

    // Check if a conversation already exists
    const existingConversation = await conversationsCollection.findOne({
      participants: { $all: [userEmail, targetEmail] },
    });

    if (existingConversation) {
      return res
        .status(200)
        .json({
          message: "Conversation already exists",
          conversation: existingConversation,
        });
    }

    // Create a new conversation
    const newConversation = {
      participants: [userEmail, targetEmail],
      messages: [], // No messages initially,
      readStatus: false,
      createdAt: new Date(),
    };

    const result = await conversationsCollection.insertOne(newConversation);

    return res.status(201).json({
      message: "New conversation created",
      conversation: { ...newConversation, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
};

const getAllConversations = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    const db = getDb();
    const conversations = await db
      .collection("conversations")
      .find({
        "participants.email": email,
      })
      .toArray();

    const formattedConversations = conversations.map((convo) => {
      const lastMessage = convo.messages[convo.messages.length - 1] || null;
      const lastTimestamp = lastMessage
        ? lastMessage.timestamp
        : convo.lastUpdated;
      const readStatus = lastMessage ? lastMessage.readStatus : true;

      return {
        _id: convo._id,
        participants: convo.participants,
        lastMessageTimestamp: lastTimestamp,
        readStatus,
      };
    });

    res.status(200).json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};


const sendMessage = async (req, res) => {
  const { userEmail, userName, targetEmail, targetName, text } = req.body;

  if (!userEmail || !userName || !targetEmail || !targetName || !text) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const db = getDb();
    const conversationsCollection = db.collection("conversations");

    const conversation = await conversationsCollection.findOne({
      participants: { $all: [{ email: userEmail }, { email: targetEmail }] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const newMessage = {
      _id: new ObjectId(),
      sender: { email: userEmail, name: userName },
      text,
      timestamp: new Date(),
      readStatus: false,
    };

    await conversationsCollection.updateOne(
      { _id: conversation._id },
      {
        $push: { messages: newMessage },
        $set: { lastUpdated: newMessage.timestamp },
      }
    );

    res.status(201).json({ message: "Message sent", newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};


const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required" });
  }

  try {
    const db = getDb();
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = conversation.messages.map((msg) => ({
      text: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
    }));

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};


const markAsRead = async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.status(400).json({ error: "Conversation ID is required" });
  }

  try {
    const db = getDb();
    await db
      .collection("conversations")
      .updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { "messages.$[].readStatus": true } }
      );

    res.status(200).json({ message: "Conversation marked as read" });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ error: "Failed to mark conversation as read" });
  }
};


module.exports = { createConversation, getAllConversations, sendMessage, getMessages, markAsRead };