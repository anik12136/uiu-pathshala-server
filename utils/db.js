const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();


// Connection URL and Database Name
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.00oqpy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const dbName = "uiu-pathshala";

let db;

const connectDB = async () => {
  try {
    if (db) return db; // If already connected, return the existing connection
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
