import { Request, Response } from "express";
import fs from "fs";
import { Keypair } from "@solana/web3.js";
import { coinsCollection } from "../../db/mongo";
import logger from "../../utils/logger";

const createCoin = async (req: Request, res: Response) => {
  const { name, ticker, description, twitter, telegram, website } = req.body;
  const mintPublicKey = Keypair.generate().publicKey;
  const currentDateTime = new Date();
  // Payload to create new coin
  const newCoin = {
    name,
    ticker,
    description,
    image: "https://picsum.photos/128/128", // TODO: get url of uploaded image
    twitter,
    telegram,
    website,
    pubkey: mintPublicKey.toString(),
    market_cap: 0,
    created_by: req.session.wallet,
    created_at: currentDateTime,
    updated_at: currentDateTime,
  };

  try {
    const result = await coinsCollection.insertOne(newCoin);

    return res
      .status(200)
      .json({ message: "Success", data: result.insertedId });
  } catch (error) {
    logger.error("Error saving coin:", error);
    return res.status(500).json({ message: "Error saving coin to database" });
  } finally {
    // Delete temporary file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
};

export default createCoin;
