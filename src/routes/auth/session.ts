import { Request, Response } from "express";
const session = async (req: Request, res: Response) => {
  return res.json(req.session.wallet ? {
    wallet: req.session.wallet,
    username: req.session.username,
    bio: req.session.bio
  } : null)
}

export default session;