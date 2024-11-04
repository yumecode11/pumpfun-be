import { Request, Response } from "express";

import { coinsCollection } from "../../db/mongo";

const latestCoinCreated = async (req: Request, res: Response) => {
  const size = parseInt(req.query.size as string, 10) || 1;

  try {
    const result = await coinsCollection
      .find()
      .sort({ created_at: -1 })
      .limit(size)
      .toArray();

    return res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        result,
        pagination: {
          size,
          totalItems: result.length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Error retrieving latest coins from database",
    });
  }
};

export default latestCoinCreated;
