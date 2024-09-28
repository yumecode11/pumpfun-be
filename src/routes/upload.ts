import {Request, Response} from "express";

export default async (req: Request, res: Response) => {
  const image = req.file as Express.MulterS3.File

  res.json({
    url: image.location
  })
}