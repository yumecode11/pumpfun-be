import { ObjectId } from "mongodb";
import type {
  CoinTradesArgs,
  CoinTradesResponse,
} from "types/coin-trades.type";
import {
  coinsCollection,
  coinTradesCollection,
  mongoClient,
} from "../../db/mongo";
import logger from "../../utils/logger";

// Dummy function to create transaction-hash (tx_hash)
const generateTxHash = () => {
  return `tx_${Math.random().toString(36).substr(2, 9)}`;
};

const coinTrades = async ({
  type,
  coin,
  wallet,
  amount,
}: CoinTradesArgs): Promise<CoinTradesResponse> => {
  if (!ObjectId.isValid(coin)) {
    return {
      code: 400,
      message: "Invalid coin ID",
      data: null,
    };
  }

  const session = mongoClient.startSession();
  try {
    session.startTransaction();

    // Payload for trade
    const newTrade = {
      coin_id: new ObjectId(coin),
      wallet,
      amount_in: type === "buy" ? parseFloat(amount) : 0,
      amount_out: type === "sell" ? parseFloat(amount) : 0,
      tx_hash: generateTxHash(),
      timestamp: new Date(),
    };

    // Insert trade into coinTradesCollection
    const result = await coinTradesCollection.insertOne(newTrade, { session });

    // Update coin market cap
    const marketCapUpdateValue =
      type === "buy" ? parseFloat(amount) : -parseFloat(amount);
    const updateResult = await coinsCollection.updateOne(
      { _id: new ObjectId(coin) },
      {
        $inc: { market_cap: marketCapUpdateValue },
        $set: { updated_at: new Date() },
      },
      { session }
    );

    if (!updateResult.modifiedCount) {
      throw new Error("Failed to update coin market cap.");
    }

    // Commit transaction
    await session.commitTransaction();

    return {
      code: 200,
      message: "Success",
      data: {
        tradeId: result.insertedId.toString(),
        coin_id: newTrade.coin_id.toString(),
        wallet: newTrade.wallet,
        amount_in: newTrade.amount_in,
        amount_out: newTrade.amount_out,
        tx_hash: newTrade.tx_hash,
        timestamp: newTrade.timestamp,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error processing coin trades:", error);
    return {
      code: 500,
      message: "Error processing coin trades",
      data: null,
    };
  } finally {
    session.endSession();
  }
};

export default coinTrades;
