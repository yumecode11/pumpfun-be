import { Request, Response } from "express";
import fs from "fs";
import { db } from "../db/mongo";

const coinsCollection = db.collection("coins");

const createCoin = async (req: Request, res: Response) => {
  const { name, ticker, description, twitter, telegram, website } = req.body;
  // Payload to create new coin
  const newCoin = {
    name,
    ticker,
    description,
    image: 'https://picsum.photos/128/128',
    twitter,
    telegram,
    website,
    marketCap: 0,
    replies: [],
    trades: [],
    created_at: new Date(),
    created_by: "user_id_0",
  };

  try {
    const result = await coinsCollection.insertOne(newCoin);

    return res.status(200).json({ message: "Coin created successfully", data: result.insertedId });
  } catch (error) {
    return res.status(500).json({ error: "Error saving coin to database" });
  } finally {
    // Delete temporary file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
};

export default createCoin;
