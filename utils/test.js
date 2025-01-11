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

    const users = client.db("uiu-pathshala").collection("users");
    

    const result = await users.find().toArray();
    console.log("Users List:", result);

  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Call the function
getUsers();
