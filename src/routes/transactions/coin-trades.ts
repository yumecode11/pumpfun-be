import { ObjectId } from "mongodb";
import type {
  CoinTradesArgs,
  CoinTradesResponse,
} from "types/coin-trades.type";
import { coinsCollection, coinTradesCollection } from "../../db/mongo";

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
  try {
    // Payload
    const newTrade = {
      coin_id: coin,
      wallet,
      amount_in: type === "buy" ? parseFloat(amount) : 0,
      amount_out: type === "sell" ? parseFloat(amount) : 0,
      tx_hash: generateTxHash(), // This should be replaced with a real tx hash
      timestamp: new Date(),
    };

    // Save to database
    const result = await coinTradesCollection.insertOne(newTrade);

    // Update coin
    const marketCapUpdateValue =
      type === "buy" ? parseFloat(amount) : -parseFloat(amount);
    const updateResult = await coinsCollection.updateOne(
      { _id: new ObjectId(coin) },
      {
        $inc: { market_cap: marketCapUpdateValue },
        $set: { updated_at: new Date() },
      }
    );

    // Handle error of update coin
    if (!updateResult.modifiedCount) {
      throw new Error("Failed to update coin market cap.");
    }

    return {
      code: 200,
      message: "Success",
      data: {
        tradeId: result.insertedId as unknown as string,
        ...newTrade,
      },
    };
  } catch (error) {
    return {
      code: 500,
      message: "Error processing coin purchase",
      data: null,
    };
  }
};

export default coinTrades;
