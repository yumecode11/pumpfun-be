import { Request, Response } from "express";
import { coinsCollection } from "../../db/mongo";

const searchCoins = async (req: Request, res: Response) => {
  const { keyword = "", page = 1, limit = 10 } = req.query;

  const searchQuery = keyword
    ? { name: { $regex: keyword, $options: "i" } }
    : {};

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const result = await coinsCollection
      .find(searchQuery)
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limitNumber)
      .toArray();

    const totalDocuments = await coinsCollection.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalDocuments / limitNumber);

    return res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        result,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalDocuments,
          pageSize: limitNumber,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Error retrieving coins from database",
    });
  }
};

export default searchCoins;
