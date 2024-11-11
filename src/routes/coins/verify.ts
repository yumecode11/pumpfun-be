import { Request, Response } from "express";
import { coinsCollection } from "../../db/mongo";
import logger from "../../utils/logger";

export const verifyCoin = async (req: Request, res: Response) => {
  const { mint, tx_hash } = req.body;

  if (!mint || !tx_hash) {
    const errorMessage = "Bad request! mint and tx_hash are required fields.";
    logger.error(errorMessage);
    return res.status(400).json({ message: errorMessage });
  }

  try {
    // Update the coin with the specified mint
    const updateResult = await coinsCollection.updateOne(
      { mint }, // Filter by mint
      { $set: { tx_hash } } // Update tx_hash field
    );

    // Check if a coin was updated
    if (updateResult.matchedCount === 0) {
      const errorMessage = "Coin not found with the specified mint.";
      logger.error(errorMessage);
      return res.status(404).json({ message: errorMessage });
    }

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    const errorMessage = "Failed to update transaction hash.";
    logger.error(`${errorMessage}:`, { error });
    return res.status(500).json({ message: errorMessage, error });
  }
};

export default verifyCoin;
