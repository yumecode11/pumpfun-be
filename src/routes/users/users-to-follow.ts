import { Request, Response } from 'express';

const usersToFollow = async (req: Request, res: Response) => {

  return res.status(200).json({ message: 'Success' });
}

export default usersToFollow;
