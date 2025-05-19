import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "invasionHistory";
const collectionName = "history";

export async function connectToInvasionHistoryDB(collectionOverride) {
  try {
    await client.connect();
    const database = client.db(dbName);
    if (collectionOverride) {
      return database.collection(collectionOverride);
    }
    return database.collection(collectionName);
  } catch (error) {
    console.error(
      "Error connecting to MongoDB (invasionHistory):",
      error.message
    );
    throw error;
  }
}
