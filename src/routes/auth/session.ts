import { Request, Response } from "express";
const session = async (req: Request, res: Response) => {
  return res.json(req.session.wallet ? {
    wallet: req.session.wallet,
    chain: req.session.chain,
    verified: req.session.verified
  } : null)
}

export default session;