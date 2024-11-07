import { Request, Response } from "express";
import coinTrades from "./coin-trades";

const sell = async (req: Request, res: Response) => {
  const { coin, wallet, amount } = req.body;

  if (!coin || !wallet || !amount) {
    return res.status(400).json({ message: "Bad request" });
  }

  const saveDb = await coinTrades({ type: "sell", coin, wallet, amount });
  const { code, ...rest } = saveDb;

  return res.status(code).json(rest);
};

export default sell;
