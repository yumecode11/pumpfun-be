import { Request, Response } from 'express';

const latestCoinCreated = async (req: Request, res: Response) => {

  return res.status(200).json({ message: 'Success' });
}

export default latestCoinCreated;
