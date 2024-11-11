import { Request, Response } from "express";
import { Keypair, LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { AuthorityType, createAssociatedTokenAccountIdempotentInstruction, createMint, createMintToInstruction, createSetAuthorityInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { coinsCollection } from "../../db/mongo";
import {
  uploadImageToPinata,
  uploadJsonToPinata,
} from "../../utils/pinataService";
import logger from "../../utils/logger";
import contractConfig from "../../../contract/config.json";
import { Transaction } from "@solana/web3.js";
import base58 from "bs58";
import { connection } from "../../config";
import { PublicKey } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {utils} from "@project-serum/anchor";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata'


// Dummy generateMessage function
type GenerateMessageArgs = {
  mint: string;
  uri: string;
  creator: string;
  name: string;
  symbol: string;
};

const curveSeed = "CurveConfiguration"
const POOL_SEED_PREFIX = "liquidity_pool"
const LIQUIDITY_SEED = "LiqudityProvider"
const SOL_VAULT_PREFIX = "liquidity_sol_vault"

export function toSerializedMessage(transaction: Transaction): string {
  const base58Buffer = base58.encode(transaction.serializeMessage());
  return base58Buffer;
}

const generateMessage = async ({ mint, uri, creator, name, symbol }: GenerateMessageArgs) => {
  const mint1 = new PublicKey(mint)

  const [curveConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(curveSeed)],
    new PublicKey(contractConfig.program_id)
  )

  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mint1?.toBuffer()],
    new PublicKey(contractConfig.program_id)
  )

  const poolToken = await getAssociatedTokenAddress(
    mint1, poolPda, true
  )

  const bondingCurve = new PublicKey(contractConfig.program_id);
  const tokenAccountSync = getAssociatedTokenAddressSync(mint1, bondingCurve);
  const tokenAccountIx = createAssociatedTokenAccountIdempotentInstruction(
    bondingCurve,
    tokenAccountSync,
    bondingCurve,
    mint1,
    TOKEN_PROGRAM_ID
  )
  const seed1 = Buffer.from(utils.bytes.utf8.encode("metadata"));
  const seed2 = Buffer.from(PROGRAM_ID.toBytes());
  const seed3 = Buffer.from(mint1.toBytes());

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [seed1, seed2, seed3],
    PROGRAM_ID
  );
  const metadataIx = createCreateMetadataAccountV3Instruction({
      metadata: metadataPDA,
      mint: mint1,
      mintAuthority: bondingCurve,
      payer: new PublicKey(creator),
      updateAuthority: bondingCurve,
  }, {
      createMetadataAccountArgsV3: {
          data: {
            name: name,
            symbol: symbol,
            uri: uri,
            // we don't need that
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: false,
          collectionDetails: null, // Adjust as needed
      },
  });

  const mintToIx = createMintToInstruction(mint1, tokenAccountSync, bondingCurve, 1000000000000000)
  const mintRevokeIx = createSetAuthorityInstruction(
    mint1,
    bondingCurve,
    AuthorityType.MintTokens,
    null,
  )

  const tx = new Transaction()
    .add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1200_000 }),
      metadataIx,
      mintToIx,
      mintRevokeIx,
      await program.methods
        .createPool()
        .accounts({
          pool: poolPda,
          tokenMint: mint1,
          poolTokenAccount: poolToken,
          payer: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId
        })
        .instruction()
    )
  tx.feePayer = user.publicKey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(creator),
    toPubkey: new PublicKey("AH1c3YeJeEyxZK719bhCdbrrYidM8dHKy4bUjaH1oeEV"),
    lamports: 0.000000001 * LAMPORTS_PER_SOL,
  });
  const transaction = new Transaction();
  const latestBlockhash = await connection
    .getLatestBlockhash("finalized")
    .catch((e) => logger.error(e));

  transaction.feePayer = new PublicKey(creator);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.add(transferInstruction);
  return toSerializedMessage(transaction);
};

export const initiateCoin = async (req: Request, res: Response) => {
  const { name, ticker, description, twitter, telegram, website } = req.body;
  const imagePath = req.file?.path;

  if (!req.session.wallet) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!imagePath) {
    logger.error(
      "Bad request! Upload file to Pinata failed. Image file is required."
    );
    return res.status(400).json({ message: "Image file is required" });
  }

  if (!name || !ticker || !description) {
    logger.error("Bad request! Required fields are missing.");
    return res
      .status(400)
      .json({ message: "Name, ticker, and description are required fields." });
  }

  try {
    // Upload image to IPFS via Pinata
    const ipfsHash = await uploadImageToPinata(imagePath);

    const mintPublicKey = Keypair.generate().publicKey;
    const coinData = {
      name,
      ticker,
      description,
      image: `ipfs://${ipfsHash}`,
      links: [
        { name: "twitter", url: twitter },
        { name: "telegram", url: telegram },
        { name: "website", url: website },
      ],
    };

    // Upload the coin data JSON to Pinata
    const jsonFileName = `${ticker}-coin.json`;
    const jsonIpfsHash = await uploadJsonToPinata(coinData, jsonFileName);
    const currentDateTime = new Date();
    // Save the coin data to MongoDB with the IPFS hash for the JSON
    const newCoin = {
      ...coinData,
      mint: mintPublicKey.toString(),
      meta: `ipfs://${jsonIpfsHash}`,
      market_cap: 0,
      created_by: req.session.wallet,
      updated_at: currentDateTime,
      created_at: currentDateTime,
      tx_hash: null,
    };

    try {
      const result = await coinsCollection.insertOne(newCoin);

      if (!result.insertedId) {
        throw new Error("Failed to create coin on database.");
      }

      const unsignedMessage = await generateMessage({
        mint: newCoin.mint,
        uri: newCoin.meta,
        creator: req.session.wallet,
        name: coinData.name,
        symbol: coinData.ticker
      });

      return res.status(200).json({
        message: "Success",
        data: {
          unsignedMessage,
          mint: newCoin.mint,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create coin", error });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to create coin", error });
  }
};

export default initiateCoin;
