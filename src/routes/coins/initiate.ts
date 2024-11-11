import { Request, Response } from "express";
import fs from "fs";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { coinsCollection } from "../../db/mongo";
import {
  uploadImageToPinata,
  uploadJsonToPinata,
} from "../../utils/pinataService";
import logger from "../../utils/logger";
import contractConfig from "../../../contract/config.json";
import { Transaction } from "@solana/web3.js";
import base58 from "bs58";
import { connection } from "../../config";
import { PublicKey } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

// Dummy generateMessage function
type GenerateMessageArgs = {
  mint: string;
  uri: string;
  creator: string;
};

export function toSerializedMessage(transaction: Transaction): string {
  const base58Buffer = base58.encode(transaction.serializeMessage());
  return base58Buffer;
}

const generateMessage = async ({ mint, uri, creator }: GenerateMessageArgs) => {
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(creator),
    toPubkey: new PublicKey("AH1c3YeJeEyxZK719bhCdbrrYidM8dHKy4bUjaH1oeEV"),
    lamports: 0.000000001 * LAMPORTS_PER_SOL,
  });
  const transaction = new Transaction();
  const latestBlockhash = await connection
    .getLatestBlockhash("finalized")
    .catch((e) => logger.error(e));

  transaction.feePayer = new PublicKey(creator);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.add(transferInstruction);
  return toSerializedMessage(transaction);
};

export const initiateCoin = async (req: Request, res: Response) => {
  const { name, ticker, description, twitter, telegram, website } = req.body;
  const imagePath = req.file?.path;

  if (!req.session.wallet) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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
      links: [
        { name: "twitter", url: twitter },
        { name: "telegram", url: telegram },
        { name: "website", url: website },
      ],
    };

    // Upload the coin data JSON to Pinata
    const jsonFileName = `${ticker}-coin.json`;
    const jsonIpfsHash = await uploadJsonToPinata(coinData, jsonFileName);
    const currentDateTime = new Date();
    // Save the coin data to MongoDB with the IPFS hash for the JSON
    const newCoin = {
      ...coinData,
      mint: mintPublicKey.toString(),
      meta: `ipfs://${jsonIpfsHash}`,
      market_cap: 0,
      created_by: req.session.wallet,
      updated_at: currentDateTime,
      created_at: currentDateTime,
      tx_hash: null,
    };

    try {
      const result = await coinsCollection.insertOne(newCoin);

      if (!result.insertedId) {
        throw new Error("Failed to create coin on database.");
      }

      const unsignedMessage = await generateMessage({
        mint: newCoin.mint,
        uri: newCoin.meta,
        creator: req.session.wallet,
      });

      return res.status(200).json({
        message: "Success",
        data: {
          unsignedMessage,
          mint: newCoin.mint,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create coin", error });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to create coin", error });
  }
};

export default initiateCoin;
