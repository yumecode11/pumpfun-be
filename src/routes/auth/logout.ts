import { Request, Response } from "express";

const logout = async (req: Request, res: Response) => {
  req.session.destroy(() => res.json({
    message: 'Logged out'
  }));
}

export default logout;
