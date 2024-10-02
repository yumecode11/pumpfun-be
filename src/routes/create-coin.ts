import { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

// Temporary file will be store in /uploads
const upload = multer({ dest: "uploads/" });

export default async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadSingle = upload.single("image");

    // Upload file first
    uploadSingle(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: "Error uploading file" });
      }

      const { name, ticker, description, twitter, telegram, website } =
        req.body;

      if (!name || !ticker || !description) {
        return res
          .status(400)
          .json({ error: "Name, ticker, and description are required." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image is required." });
      }

      const fileContent = fs.readFileSync(req.file.path);
      const fileName = `${uuidv4()}-${req.file.originalname}`;

      // Payload for uploading to S3
      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        Body: fileContent,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      };

      try {
        await s3.send(new PutObjectCommand(params));

        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Payload to create new coin
        const newCoin = {
          name,
          ticker,
          description,
          image: imageUrl,
          twitter,
          telegram,
          website,
        };

        // TODO: save to database

        // Delete temporary file after upload
        fs.unlinkSync(req.file.path);

        return res.status(201).json({ message: "Success", data: true });
      } catch (error) {
        // TODO: logger for error uploading to s3
        return res.status(500).json({ error: "Error uploading to s3" });
      }
    });
  } catch (error) {
    // TODO: logger for error
    res.status(500).json({ error: "Internal Server Error" });
  }
};
