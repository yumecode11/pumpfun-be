import { Request, Response, NextFunction } from 'express'

const authMiddleware = async (req: Request, res: Response, next: NextFunction ) => {
  if (!req.session.wallet) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}

export default authMiddleware;