import { Request, Response } from "express";

const withdraw = async (req: Request, res: Response) => {
  return res.status(200).json({ message: "Success" });
};

export default withdraw;
