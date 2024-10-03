import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";
const mongoClient = new MongoClient(uri);

const connectMongo = async () => {
  try {
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export { mongoClient, connectMongo };