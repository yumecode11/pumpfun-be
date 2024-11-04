import { Request, Response } from "express";

const latestTrades = async (req: Request, res: Response) => {
  return res.status(200).json({ message: "Success" });
};

export default latestTrades;
