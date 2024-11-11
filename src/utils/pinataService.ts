import { PinataSDK } from "pinata-web3";
import fs from "fs";
import path from "path";
import { Blob } from "buffer";
import logger from "./logger";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export const uploadImageToPinata = async (filePath: string) => {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/jpeg" });
  const fileObject = Object.assign(blob, {
    name: path.basename(filePath),
    lastModified: Date.now(),
  });

  try {
    const result = await pinata.upload.file(fileObject, {
      metadata: {
        name: path.basename(filePath),
      },
    });
    return result.IpfsHash;
  } catch (error) {
    logger.error("Failed to upload image to Pinata:", { error });
    throw new Error("Image upload failed");
  }
};

export const uploadJsonToPinata = async (
  jsonData: object,
  fileName: string
) => {
  // Convert JSON to a buffer
  const jsonBuffer = Buffer.from(JSON.stringify(jsonData));

  // Create a Blob from the buffer
  const blob = new Blob([jsonBuffer], { type: "application/json" });

  // Create fileObject to meet Pinata's requirements
  const fileObject = Object.assign(blob, {
    name: fileName,
    lastModified: Date.now(),
  });

  try {
    // Upload the JSON file to Pinata
    const result = await pinata.upload.file(fileObject, {
      metadata: {
        name: fileName,
      },
    });
    return result.IpfsHash; // Return the IPFS hash of the uploaded file
  } catch (error) {
    logger.error("Failed to upload JSON to Pinata:", { error });
    throw new Error("JSON upload failed");
  }
};
