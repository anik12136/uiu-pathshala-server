const { ObjectId } = require("mongodb");
const connectDB = require("../utils/db"); 

// Get unread notifications for a user
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const db = await connectDB();
        const notificationsCollection = db.collection("notifications");

        const notifications = await notificationsCollection
            .find({ userId: new ObjectId(userId), isRead: false })
            .toArray();

        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        const db = await connectDB();
        const notificationsCollection = db.collection("notifications");

        await notificationsCollection.updateMany(
            { userId: new ObjectId(userId) },
            { $set: { isRead: true } }
        );

        res.json({ message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update notifications" });
    }
};

module.exports = { getNotifications, markNotificationsAsRead };
