require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
// MongoDB connection URL
const dbURL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.00oqpy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(dbURL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


// Function to fetch all users
async function getUsers() {
  try {

    const users = client.db("uiu-pathshala").collection("courses");
    

    const result = await users.find().toArray();
    console.log("Users List:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Function to drop the 'courses' collection
async function dropCoursesCollection() {
  try {
    // Access the database and collection
    const db = client.db("uiu-pathshala");
    const courses = db.collection("courses");

    // Drop the collection
    await courses.drop();
    console.log("Courses collection dropped successfully");
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") {
      console.log("Courses collection does not exist, nothing to drop.");
    } else {
      console.error("Error dropping courses collection:", error);
    }
  }
}

// dropCoursesCollection();
getUsers();


