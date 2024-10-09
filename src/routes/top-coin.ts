import { Request, Response } from 'express';

const topCoin = async (req: Request, res: Response) => {

  return res.status(200).json({ message: 'Success' });
}

export default topCoin;
