import { Request, Response } from "express";
import coinTrades from "./coin-trades";

const buy = async (req: Request, res: Response) => {
  const { coin, wallet, amount } = req.body;

  if (!coin || !wallet || !amount) {
    return res.status(400).json({ message: "Bad request" });
  }

  const saveDb = await coinTrades({ type: "buy", coin, wallet, amount });

  return res.status(saveDb.code).json(saveDb);
};

export default buy;
