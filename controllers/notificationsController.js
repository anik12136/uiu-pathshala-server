const { ObjectId } = require("mongodb");
const connectDB = require("../utils/db");

// ✅ Get unread notifications for a user
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const db = await connectDB();
        const notificationsCollection = db.collection("notifications");

        const notifications = await notificationsCollection
            .find({ userId: new ObjectId(userId), isRead: false }) // Fetch only unread
            .sort({ createdAt: -1 }) // Sort by latest notifications
            .toArray();

        res.json({ success: true, notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

// ✅ Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.body;

        // Validate userId
        if (!userId || !ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid or missing user ID" });
        }

        const db = await connectDB();
        const notificationsCollection = db.collection("notifications");

        const result = await notificationsCollection.updateMany(
            { userId: new ObjectId(userId), isRead: false }, // Update only unread
            { $set: { isRead: true } }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error("Error updating notifications:", error);
        res.status(500).json({ error: "Failed to update notifications" });
    }
};

module.exports = { getNotifications, markNotificationsAsRead };
