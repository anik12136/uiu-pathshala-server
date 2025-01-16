const express = require("express");
const router = express.Router();
const bookmarkController = require("../controllers/bookmark.controller");


//Bookmark add

router.post("/addBookmark", bookmarkController.createBookMark)



// get BookMark for that user

router.get("/getAllBookMark/:UserMail", bookmarkController.getAllBookMarkForThatUser)



// Delete BookMark

router.delete("/deleteSingleBookMark/:id", bookmarkController.deleteSingleBookMark)


module.exports = router;
