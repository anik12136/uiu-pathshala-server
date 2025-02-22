const connectDB = require("../utils/db");




const getAllConversations = async (req, res) => {
  try {
    // Assume the user's email is passed as a query parameter (or you can change as needed)
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Connect to the database and get the conversations collection
    const db = await connectDB();
    const conversationsCollection = db.collection("conversations");

    // Find conversations where the user is a participant
    const conversations = await conversationsCollection
      .find({ "participants.email": email })
      .toArray();

    return res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const sendMessage = async (req, res) => {
  try {
    // Incoming request body: recipient, content, timestamp, sender
    // sender and recipient here are the emails (userIds) from the users collection
    const { recipient, content, timestamp, sender } = req.body;

    // Create the new message object which includes sender's email and name.
    // We'll fill in the sender's name when creating a new conversation.
    const newMessage = { senderEmail: sender, message: content, timestamp };

    // Connect to the database and get the collections
    const db = await connectDB();
    const conversationsCollection = db.collection('conversations');
    const usersCollection = db.collection('users');

    // Try to find an existing conversation that has both participants by email.
    const conversation = await conversationsCollection.findOne({
      'participants.email': { $all: [sender, recipient] }
    });

    if (conversation) {
      // Update the conversation: push the new message and update the recipient's read status.
      const updatedParticipants = conversation.participants.map((participant) => {
        // When sender sends a new message, mark the recipient's status as unread.
        if (participant.email === recipient) {
          return { ...participant, read: false };
        }
        return participant;
      });

      // Optionally, you might also want to include the sender's name in the message.
      // In an existing conversation, we assume that this information is already stored in the participants array.
      // So, add the sender's name from that array.
      const senderData = conversation.participants.find(p => p.email === sender);
      newMessage.senderName = senderData ? senderData.name : '';

      // Update the conversation document with the new message and updated participants array.
      await conversationsCollection.updateOne(
        { _id: conversation._id },
        {
          $push: { messages: newMessage },
          $set: { participants: updatedParticipants }
        }
      );

      // Re-fetch the updated conversation document.
      const updatedConversation = await conversationsCollection.findOne({ _id: conversation._id });
      return res.status(200).json(updatedConversation);
    } else {
      // No conversation exists: look up both users' names from the users collection.
      // Here, "email" is used as the unique identifier.
      const senderUser = await usersCollection.findOne({ email: sender });
      const recipientUser = await usersCollection.findOne({ email: recipient });

      if (!senderUser || !recipientUser) {
        return res.status(404).json({ message: 'Sender or recipient not found' });
      }

      // Build the participants array.
      // The sender's name is taken from senderUser.name and likewise for the recipient.
      // The sender's read status is true (since they've just sent the message) and recipient's is false.
      const participants = [
        { email: sender, name: senderUser.name, read: true },
        { email: recipient, name: recipientUser.name, read: false }
      ];

      // Include sender's name in the message.
      newMessage.senderName = senderUser.name;

      // Create a new conversation document with the initial message.
      const newConversation = {
        participants,
        messages: [newMessage],
        createdAt: new Date()
      };

      const insertResult = await conversationsCollection.insertOne(newConversation);
      const createdConversation = await conversationsCollection.findOne({ _id: insertResult.insertedId });

      return res.status(201).json(createdConversation);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
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


const markConversationAsRead = async (req, res) => {
  try {
    // Extract conversationId and receiver's email from the request body (or params)
    const { conversationId, receiver } = req.body;

    if (!conversationId || !receiver) {
      return res
        .status(400)
        .json({ message: "Missing conversationId or receiver" });
    }

    // Connect to the database and get the conversations collection
    const db = await connectDB();
    const conversationsCollection = db.collection("conversations");

    // Update the participant's read status for the given conversation
    // We use the positional operator to update the correct participant array element
    const updateResult = await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId), "participants.email": receiver },
      { $set: { "participants.$.read": true } }
    );

    if (updateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: "Conversation or receiver not found" });
    }

    // Fetch the updated conversation document
    const updatedConversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
    });

    return res.status(200).json(updatedConversation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  getAllConversations,
  sendMessage,
  getMessages,
  markConversationAsRead,
};