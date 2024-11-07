import { Collection, MongoClient } from "mongodb";
import logger from "../utils/logger";

const uri = process.env.MONGODB_URI as string;
const mongoClient = new MongoClient(uri);

const dbName = process.env.DB_NAME as string;
const db = mongoClient.db(dbName);

// Collection references
const coinsCollection: Collection = db.collection("coins");
const coinTradesCollection: Collection = db.collection("coin_trades");

const connectMongo = async () => {
  try {
    await mongoClient.connect();
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
  }
};

export { mongoClient, connectMongo, db, coinsCollection, coinTradesCollection };
