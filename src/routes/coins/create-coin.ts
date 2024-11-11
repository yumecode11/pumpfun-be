import { Request, Response } from "express";
import fs from "fs";
import { Keypair } from "@solana/web3.js";
import { coinsCollection } from "../../db/mongo";
import {
  uploadImageToPinata,
  uploadJsonToPinata,
} from "../../utils/pinataService";
import logger from "../../utils/logger";

export const createCoin = async (req: Request, res: Response) => {
  const { name, ticker, description, twitter, telegram, website } = req.body;
  const imagePath = req.file?.path;

  if (!imagePath) {
    logger.error(
      "Bad request! Upload file to Pinata failed. Image file is required."
    );
    return res.status(400).json({ message: "Image file is required" });
  }

  if (!name || !ticker || !description) {
    logger.error("Bad request! Required fields are missing.");
    return res
      .status(400)
      .json({ message: "Name, ticker, and description are required fields." });
  }

  try {
    // Upload image to IPFS via Pinata
    const ipfsHash = await uploadImageToPinata(imagePath);

    const mintPublicKey = Keypair.generate().publicKey;
    const coinData = {
      name,
      ticker,
      description,
      image: `ipfs://${ipfsHash}`,
      twitter,
      telegram,
      website,
      pubkey: mintPublicKey.toString(),
    };

    // Upload the coin data JSON to Pinata
    const jsonFileName = `${ticker}-coin.json`;
    const jsonIpfsHash = await uploadJsonToPinata(coinData, jsonFileName);
    const currentDateTime = new Date();
    // Save the coin data to MongoDB with the IPFS hash for the JSON
    const newCoin = {
      ...coinData,
      meta: `ipfs://${jsonIpfsHash}`,
      market_cap: 0,
      created_by: req.session.wallet,
      updated_at: currentDateTime,
      created_at: currentDateTime,
    };

    try {
      const result = await coinsCollection.insertOne(newCoin);

      if (!result.insertedId) {
        throw new Error("Failed to create coin on database.");
      }

      return res
        .status(200)
        .json({ message: "Success", data: result.insertedId });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create coin", error });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to create coin", error });
  }
};

export default createCoin;
