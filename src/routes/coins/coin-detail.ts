import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { coinsCollection, coinTradesCollection } from "../../db/mongo";
import logger from "../../utils/logger";

const coinDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid coin ID" });
  }

  try {
    // Find coin by ID
    const coinDetail = await coinsCollection.findOne({ _id: new ObjectId(id) });
    if (!coinDetail) {
      return res.status(404).json({ message: "Coin not found" });
    }

    // Get coin transactions
    const transactions = await coinTradesCollection
      .find({ coin_id: new ObjectId(id) })
      .sort({ timestamp: -1 })
      .toArray();

    // Return coin detail and transactions
    return res.status(200).json({
      message: "Success",
      data: {
        coin: coinDetail,
        transactions: transactions,
      },
    });
  } catch (error) {
    logger.error("Error fetching coin detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default coinDetail;
