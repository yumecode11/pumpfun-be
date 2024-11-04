import { Request, Response } from "express";

import { coinsCollection } from "../../db/mongo";

const topCoin = async (req: Request, res: Response) => {
  try {
    const result = await coinsCollection
      .find()
      .sort({ market_cap: -1, updated_at: -1 })
      .limit(1)
      .toArray();

    if (result.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "No coins found",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Success",
      data: result[0],
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Error retrieving top coin from database",
    });
  }
};

export default topCoin;
