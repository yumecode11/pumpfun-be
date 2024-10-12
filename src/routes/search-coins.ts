import { Request, Response } from 'express';

const searchCoins = async (req: Request, res: Response) => {

  return res.status(200).json({ message: 'Success' });
}

export default searchCoins;
