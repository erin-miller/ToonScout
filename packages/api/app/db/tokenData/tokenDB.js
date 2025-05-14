// scoutDB.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "tokenData";
const collectionName = "users";

export async function connectToCookieDB() {
  try {
    await client.connect();
    const database = client.db(dbName);
    return database.collection(collectionName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error; // Ensure the error is propagated to the caller
  }
}
