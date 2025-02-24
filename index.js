const port = process.env.PORT || 7000;
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const messaging = require("./utils/socketHandler");
//================================multer upload=============================
const upload = require("./middleware/upload");

console.log(
  "================================================================================================================"
);
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static("public/uploads")); // anik
app.use(express.json());

// Routes
const courseRoutes = require("./routes/course.routes");
const bookMarkRoutes = require("./routes/bookMark.routes");
const chatRoutes = require("./routes/chat.routes");
const uploadRoutes = require("./routes/uploadRoutes"); //anik
const NotificationsRoutes = require("./routes/notification.routes");
const trackRoutes = require("./routes/track.routes");

app.use("/api", courseRoutes);
app.use("/chat", chatRoutes);
app.use("/track", trackRoutes);
app.use("/BookMark", bookMarkRoutes);
app.use("/uploads", express.static("uploads")); //anik
app.use("/NotificationsRoutes", NotificationsRoutes);

// Socket.io
messaging(io);
//============Socket code ends here ====================

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.00oqpy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const dbName = "uiu-pathshala"; //anik

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const courses = client.db("uiu-pathshala").collection("courses");
    const bookMarks = client.db("uiu-pathshala").collection("BookMark");
    const GeneralCommunity = client
      .db("uiu-pathshala")
      .collection("GeneralCommunity");
    const ProgrammingCommunity = client
      .db("uiu-pathshala")
      .collection("ProgrammingCommunity");
    const ProgrammingComment = client
      .db("uiu-pathshala")
      .collection("ProgrammingComment");

    const users = client.db("uiu-pathshala").collection("users");

    const ProgrammingContest = client
      .db("uiu-pathshala")
      .collection("ProgrammingContest");
    // =============================Library Collection==============================
    const books = client.db("uiu-pathshala").collection("books");
    const questions = client.db("uiu-pathshala").collection("questions");
    const notes = client.db("uiu-pathshala").collection("notes");
    const curriculums = client.db("uiu-pathshala").collection("curriculums");

    //=======================================Yamin Starts Here===================================================
    // books
    app.get("/books", async (req, res) => {
      console.log(req.query);
      const query = { courseName: req.query.courseName };
      const cursor = await books.find(query).toArray();
      res.send(cursor)
    });
    app.post("/books", upload.single("file"), async (req, res) => {
      console.log("PDF file uploader API is hitting");
      const book = req.body;
      book.filename = req.file?.filename;
      console.log(req.file);
      const result = await books.insertOne(book);
      res.send(result);
    });
    // questions
    app.get("/questions", async (req, res) => {
      console.log(req.query);
      const query = { courseName: req.query.courseName };
      const cursor = await questions.find(query).toArray();
      res.send(cursor)
    });
    app.post("/questions", upload.single("file"), async (req, res) => {
      console.log("PDF file uploader API is hitting");
      const book = req.body;
      book.filename = req.file?.filename;
      console.log(req.file);
      const result = await questions.insertOne(book);
      res.send(result);
    });
    // notes
    app.get("/notes", async (req, res) => {
      console.log(req.query);
      const query = { courseName: req.query.courseName };
      const cursor = await notes.find(query).toArray();
      res.send(cursor)
    });
    app.post("/notes", upload.single("file"), async (req, res) => {
      console.log("PDF file uploader API is hitting");
      const book = req.body;
      book.filename = req.file?.filename;
      console.log(req.file);
      const result = await notes.insertOne(book);
      res.send(result);
    });
   
    // Curriculums
    app.get("/curriculums", async (req, res) => {
      console.log(req.query);
      const query = { courseName: req.query.courseName };
      const cursor = await curriculums.find(query).toArray();
      res.send(cursor)
    });
    app.post("/curriculums", upload.single("file"), async (req, res) => {
      console.log("PDF file uploader API is hitting");
      const book = req.body;
      book.filename = req.file?.filename;
      console.log(req.file);
      const result = await curriculums.insertOne(book);
      res.send(result);
    });
   

    //====================================Yamin Ends here============================================

    const notificationsCollection = client
      .db("uiu-pathshala")
      .collection("notifications");
    const pdf = client.db("uiu-pathshala").collection("pdf"); //anik
    const announcements = client.db("uiu-pathshala").collection("announcements");    
     

    // ============ Anik start====================

    const db = client.db(dbName);
    app.use("/api/upload", uploadRoutes(db));

    // -----------Announcements start---------------

    app.post("/announcements", async (req, res) => {
      const { title, description } = req.body;

      if (!title || !description) {
        return res
          .status(400)
          .json({ error: "Title and description are required" });
      }

      try {
        const newAnnouncement = {
          title,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await announcements.insertOne(newAnnouncement);
        res.status(201).json({ _id: result.insertedId, ...newAnnouncement });
      } catch (error) {
        res.status(500).json({ error: "Failed to create announcement" });
      }
    });

    app.get("/announcements", async (req, res) => {
      try {
        const allAnnouncements = await announcements
          .find()
          .sort({ updatedAt: -1 }) // Sort newest first
          .toArray();

        res.json(allAnnouncements);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch announcements" });
      }
    });

    // Update Announcement (PUT)
    app.put("/announcements/:id", async (req, res) => {
      const { id } = req.params;
      const { title, description } = req.body;

      try {
        const updatedAnnouncement = await announcements.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { title, description, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
        res.json(updatedAnnouncement.value);
      } catch (error) {
        res.status(500).json({ error: "Failed to update announcement" });
      }
    });

    // Delete Announcement (DELETE)
    app.delete("/announcements/:id", async (req, res) => {
      await announcements.deleteOne({ _id: new ObjectId(req.params.id) });
      res.json({ message: "Announcement deleted successfully" });
    });

    // Announcements end-------------

    // Demo Courses Route
    app.get("/courses", async (req, res) => {
      const result = await courses.find().toArray();
      res.send(result);
    });

    // insert users to database
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const query = { email: newUser.email };
      const existingUser = await users.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      // console.log(newFormCourses);
      const result = await users.insertOne(newUser);
      res.send(result);
    });

    // single user
    app.get("/dbUser/:email", async (req, res) => {
      const email = req.params.email; // Get email from URL parameter
      const result = await users.findOne({ email: email }); // Query the database for user by email
      if (result) {
        res.send(result); // Send the user data back
      } else {
        res.status(404).send({ message: "User not found" }); // Handle case where user is not found
      }
    });

    //db updated single user data

    app.patch("/dbUser/users", async (req, res) => {
     
      try {
        const updatedUser = req.body;
        console.log(updatedUser);// Get user data from request body
        const query = { email: updatedUser.email }; // Find user by email

        const existingUser = await users.findOne(query);

        if (!existingUser) {
          return res.status(404).send({ message: "User not found" });
        }

        const updateDoc = {
          $set: {
            name: updatedUser.name || existingUser.name,
            photoURL: updatedUser.photoURL || existingUser.photoURL,
          
            rating: updatedUser.rating !== undefined ? updatedUser.rating : existingUser.rating,
            department: updatedUser.department || existingUser.department,
            studentID: updatedUser.studentID || existingUser.studentID,
          },
        };

        const result = await users.updateOne(query, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ message: "User updated successfully", success: true });
        } else {
          res.send({ message: "No changes were made", success: false });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ message: "Internal server error", error });
      }
    });







    // All users
    app.get("/allUsers", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    // All users
    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    // Get user by ID
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await users.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Admin Dashboard start----------
    // Delete user by ID
    app.delete("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const user = await users.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });

    // Warning
    app.put("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        const result = await users.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User updated successfully", result });
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    });





    // Admin Dashboard end===============

    // Student Dashboard start===========
    // dashboard courses
    app.get("/bookMarks/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookMarks
        .find({ createBy: email, type: "course" })
        .toArray();
      res.send(result);
    });
    // dashboard myContest
    app.get("/myContest/:email", async (req, res) => {
      const email = req.params.email;
      const result = await bookMarks
        .find({ createBy: email, type: "contest" })
        .toArray();
      res.send(result);
    });

    // ============ Anik end====================

    //===================General community start===================================

    // Get all posts with likes, comments, and replies
    app.get("/AllPost", async (req, res) => {
      const result = await GeneralCommunity.find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    // Create Post Route
    app.post("/CreatePost", async (req, res) => {
      const { title, content, email } = req.body;

      if (!title || !content || !email) {
        return res
          .status(400)
          .json({ message: "Title, content, and email are required" });
      }

      const post = {
        type: "post",
        title,
        content,
        email,
        createdAt: new Date(),
        likes: [],
      };

      try {
        const result = await GeneralCommunity.insertOne(post);
        res.status(201).json({
          message: "Post created successfully",
          postId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({ message: "Error creating post", error });
      }
    });

    // Like Post/Comment/Reply Route
    app.post("/likePost/:id", async (req, res) => {
      const { email } = req.body;
      const id = req.params.id;

      try {
        const item = await GeneralCommunity.findOne({ _id: new ObjectId(id) });

        if (!item) {
          return res.status(404).json({ message: "Item not found" });
        }

        const likes = item.likes || [];
        const userLikeIndex = likes.indexOf(email);

        if (userLikeIndex === -1) {
          // Add like
          await GeneralCommunity.updateOne(
            { _id: new ObjectId(id) },
            { $push: { likes: email } }
          );
          res.json({ message: "Liked successfully" });
        } else {
          // Remove like
          await GeneralCommunity.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { likes: email } }
          );
          res.json({ message: "Unliked successfully" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error updating like", error });
      }
    });

    // Delete Post Route (cascading delete)
    app.delete("/deletePost/:id", async (req, res) => {
      const postId = req.params.id;
      try {
        const post = await GeneralCommunity.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        // Get all comments for this post
        const comments = await GeneralCommunity.find({
          type: "comment",
          postId: new ObjectId(postId),
        }).toArray();

        // Get all comment IDs
        const commentIds = comments.map((comment) => comment._id);

        // Delete all replies to these comments
        await GeneralCommunity.deleteMany({
          type: "reply",
          commentId: { $in: commentIds.map((id) => new ObjectId(id)) },
        });

        // Delete all comments
        await GeneralCommunity.deleteMany({
          type: "comment",
          postId: new ObjectId(postId),
        });

        // Delete the post
        await GeneralCommunity.deleteOne({ _id: new ObjectId(postId) });

        res.status(200).json({
          message: "Post and associated content deleted successfully",
        });
      } catch (error) {
        res.status(500).json({ message: "Error deleting post", error });
      }
    });

    // Delete Comment Route (cascading delete)
    app.delete("/deleteComment/:id", async (req, res) => {
      const commentId = req.params.id;
      try {
        // Delete all replies to this comment
        await GeneralCommunity.deleteMany({
          type: "reply",
          commentId: new ObjectId(commentId),
        });

        // Delete the comment
        await GeneralCommunity.deleteOne({ _id: new ObjectId(commentId) });

        res
          .status(200)
          .json({ message: "Comment and replies deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Error deleting comment", error });
      }
    });

    // Create Comment Route
    app.post("/CreateComment", async (req, res) => {
      const { postId, content, email } = req.body;

      if (!postId || !content || !email) {
        return res
          .status(400)
          .json({ message: "Post ID, content, and email are required" });
      }

      const comment = {
        type: "comment",
        postId: new ObjectId(postId),
        content,
        email,
        createdAt: new Date(),
        likes: [],
      };

      try {
        const result = await GeneralCommunity.insertOne(comment);
        res.status(201).json({
          message: "Comment created successfully",
          commentId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({ message: "Error creating comment", error });
      }
    });

    //General Community finished

    //-----------------------------------------------------------------------//

    //Programming Community Code Start

    // Get all posts with likes, comments, and replies

    app.get("/GetProgrammingPost", async (req, res) => {
      const result = await ProgrammingCommunity.find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    // Create Post Route
    app.post("/CreateProgrammingPost", async (req, res) => {
      const { title, description, tags, language, code, author } = req.body;

      if (!title || !description || !code || !language || !author) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      const post = {
        title,
        description,
        tags: tags.split(",").map((tag) => tag.trim()), // Convert comma-separated tags to array
        language,
        code,
        author,

        createdAt: new Date(),
      };

      try {
        const result = await ProgrammingCommunity.insertOne(post);
        res
          .status(201)
          .json({ message: "Post created successfully", postId: result._id });
      } catch (error) {
        res.status(500).json({ message: "Error creating post", error });
      }
    });

    // Get comments for a post
    app.get("/GetProgrammingComments/:postId", async (req, res) => {
      try {
        const postId = new ObjectId(req.params.postId);
        const comments = await ProgrammingComment.find({ postId })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(comments);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error fetching comments", error: error.message });
      }
    });

    // Create comment
    app.post("/CreateProgrammingComment", async (req, res) => {
      try {
        const { postId, author, text } = req.body;

        if (!postId || !author || !text) {
          return res.status(400).json({ message: "Required fields missing" });
        }

        const comment = {
          postId: new ObjectId(postId),
          author,
          text,
          likes: [],
          dislikes: [],
          isAnswer: false,
          createdAt: new Date(),
        };

        const result = await ProgrammingComment.insertOne(comment);
        const insertedComment = await ProgrammingComment.findOne({
          _id: result.insertedId,
        });

        res.status(201).json({
          message: "Comment created successfully",
          comment: insertedComment,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error creating comment", error: error.message });
      }
    });

    //vote create
    app.put("/VoteProgrammingComment/:commentId", async (req, res) => {
      try {
        const commentId = new ObjectId(req.params.commentId); // Convert the commentId to ObjectId
        const { type, author } = req.body; // Get vote type and author from request body

        // Ensure valid vote type (either 'like' or 'dislike')
        if (!["like", "dislike"].includes(type)) {
          return res.status(400).json({ message: "Invalid vote type" });
        }

        // Set the field based on vote type
        const field = type === "like" ? "likes" : "dislikes";
        const oppositeField = type === "like" ? "dislikes" : "likes";

        // Create the update object
        const update = {
          $addToSet: { [field]: author }, // Add the author to the appropriate field (like/dislike)
          $pull: { [oppositeField]: author }, // Remove the author from the opposite field
        };

        // Update the comment in the database
        const result = await ProgrammingComment.findOneAndUpdate(
          { _id: commentId },
          update,
          { returnDocument: "after" }
        );

        // If the comment is not found
        if (!result.value) {
          return res.status(404).json({ message: "Comment not found" });
        }

        // Return the updated comment as response
        res.json({
          message: "Vote recorded successfully",
          comment: result.value,
        });
      } catch (error) {
        // Catch any errors and respond with an error message
        res
          .status(500)
          .json({ message: "Error voting on comment", error: error.message });
      }
    });

    // Delete a post
    app.delete("/DeleteProgrammingPost/:postId", async (req, res) => {
      try {
        const postId = new ObjectId(req.params.postId);
        console.log(postId);

        const post = await ProgrammingCommunity.findOne({ _id: postId });

        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        await ProgrammingCommunity.deleteOne({ _id: postId });
        res.json({ message: "Post deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error deleting post", error: error.message });
      }
    });

    // Update a post
    app.put("/UpdateProgrammingPost/:postId", async (req, res) => {
      try {
        const postId = new ObjectId(req.params.postId);
        const { title, description, code, tags } = req.body;

        const post = await ProgrammingCommunity.findOne({ _id: postId });

        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }

        const updatedPost = await ProgrammingCommunity.findOneAndUpdate(
          { _id: postId },
          { $set: { title, description, code, tags } }
        );

        res.json({ message: "Post updated successfully", post: updatedPost });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error updating post", error: error.message });
      }
    });

    // Delete a comment
    app.delete("/DeleteProgrammingComment/:commentId", async (req, res) => {
      try {
        const commentId = new ObjectId(req.params.commentId);

        const comment = await ProgrammingComment.findOne({ _id: commentId });

        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        await ProgrammingComment.deleteOne({ _id: commentId });
        res.json({ message: "Comment deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error deleting comment", error: error.message });
      }
    });

    // Update a comment
    app.put("/UpdateProgrammingComment/:commentId", async (req, res) => {
      try {
        const commentId = new ObjectId(req.params.commentId);
        const { text } = req.body;

        const comment = await ProgrammingComment.findOne({ _id: commentId });

        if (!comment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        const updatedComment = await ProgrammingComment.findOneAndUpdate(
          { _id: commentId },
          { $set: { text } },
          { returnDocument: "after" }
        );

        res.json({
          message: "Comment updated successfully",
          comment: updatedComment,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error updating comment", error: error.message });
      }
    });

    // Mark comment as answer
    app.put("/MarkProgrammingAnswer/:commentId", async (req, res) => {
      try {
        const commentId = new ObjectId(req.params.commentId);
        const result = await ProgrammingComment.findOneAndUpdate(
          { _id: commentId },
          { $set: { isAnswer: true } },
          { returnDocument: "after" }
        );

        if (!result.value) {
          return res.status(404).json({ message: "Comment not found" });
        }

        res.json({
          message: "Comment marked as answer",
          comment: result.value,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error marking answer", error: error.message });
      }
    });

    //================Programming Community Code End==========================

    //=====================Contest Code Start from here========================

    // Create a new contest
    app.post("/CreateContest", async (req, res) => {
      const {
        title,
        description,
        startDate,
        startTime,
        duration,
        languages,
        difficulty,
        banner,
        author,
      } = req.body;

      if (
        !title ||
        !description ||
        !startDate ||
        !startTime ||
        !duration ||
        !languages ||
        !author
      ) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      const contest = {
        title,
        description,
        startDate,
        startTime,
        duration,
        languages,
        difficulty,
        banner,
        author, // this will be the author extracted from the email before '@'
        createdAt: new Date(),
      };

      try {
        // Insert contest into database
        const result = await ProgrammingContest.insertOne(contest);

        // Fetch all users to send notifications
        const allUsers = await users
          .find({}, { projection: { _id: 1 } })
          .toArray();

        // Create notifications for all users
        const notifications = allUsers.map((user) => ({
          userId: user._id,
          message: `🚀 A new programming contest '${title}' has been announced! 🏆`,
          contestId: result.insertedId,
          isRead: false,
          createdAt: new Date(),
        }));

        // Insert notifications into the notifications collection
        if (notifications.length > 0) {
          await notificationsCollection.insertMany(notifications);
        }

        res.status(201).json({
          message: "Contest created successfully",
          contestId: result.insertedId,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error creating contest", error: error.message });
      }
    });

    //get  all contest

    app.get("/GetContest", async (req, res) => {
      const result = await ProgrammingContest.find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    // Delete a contest
    app.delete("/DeleteContest/:postId", async (req, res) => {
      try {
        const postId = new ObjectId(req.params.postId);
        console.log(postId);

        const post = await ProgrammingContest.findOne({ _id: postId });

        if (!post) {
          return res.status(404).json({ message: "Contest not found" });
        }

        await ProgrammingContest.deleteOne({ _id: postId });
        res.json({ message: "Contest deleted successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Error deleting Contest", error: error.message });
      }
    });

    // Get a single contest by ID
    app.get("/GetContest/:postId", async (req, res) => {
      try {
        const postId = req.params.postId;
        const result = await ProgrammingContest.find({
          _id: new ObjectId(postId),
        }).toArray();
        if (!result.length) {
          return res.status(404).send({ message: "Contest not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error retrieving contest", error });
      }
    });

    //=====================Contest Code End here===============================

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("UIU-Pathshala is Running");
});

app.listen(port, () => {
  console.log(`UIU-Pathshala API is running on port: ${port}`);
});
