const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");

//  Get unread notifications for a user
router.get("/getNotifications/:userId", notificationsController.getNotifications);

//  Mark all notifications as read for a user
router.post("/markAsRead", notificationsController.markNotificationsAsRead);


module.exports = router;
