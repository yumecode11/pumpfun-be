import { Request, Response } from "express";

const login = async (req: Request, res: Response) => {
  // Logging out
  req.session.wallet = undefined;
  req.session.token = undefined;
  req.session.save()

  return res.json({
    message: 'Logged out'
  })
}

export default login;