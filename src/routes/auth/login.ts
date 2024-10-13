import { Request, Response } from "express";

import { db } from "../../db/mongo";
import logger from "../../utils/logger";
import randomAlphanumeric from "../../utils/randomAlphanumeric";

const login = async (req: Request, res: Response) => {
  const { wallet } = req.body;

  try {
    if (!wallet) {
      return res.status(400).json({ error: "Bad request" });
    }

    let user = await db.collection("users").findOne({ wallet });

    if (!user) {
      const newUser = {
        wallet,
        username: randomAlphanumeric(),
        bio: "",
        createdAt: new Date(),
      };

      const insertResult = await db.collection("users").insertOne(newUser);

      if (insertResult.insertedId) {
        user = { ...newUser, _id: insertResult.insertedId };
      } else {
        logger.error("Error inserting new user");
        return res.status(500).json({ error: "Failed to create new user" });
      }
    }

    req.session.wallet = user?.wallet;
    req.session.username = user?.username || '';
    req.session.bio = user?.bio || '';
    req.session.save();

    return res.json({
      wallet: user?.wallet,
      username: user?.username,
      bio: user?.bio,
    });

  } catch (e: any) {
    logger.error("Login error: " + e.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default login;
