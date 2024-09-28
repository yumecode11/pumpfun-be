import { ChannelCredentials } from "@grpc/grpc-js";
import { Currency, DEVNET_PROGRAM_ID, LOOKUP_TABLE_CACHE, MAINNET_PROGRAM_ID, RAYDIUM_MAINNET, Token, TOKEN_PROGRAM_ID, TxVersion } from "@raydium-io/raydium-sdk";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { SearcherServiceClient } from "jito-ts/dist/gen/block-engine/searcher";
import { SearcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { AuthProvider, authInterceptor } from 'jito-ts/dist/sdk/block-engine/auth';
import { AuthServiceClient } from "jito-ts/dist/gen/block-engine/auth";

// RPC
export const heliusURL: string = "https://mainnet.helius-rpc.com/?api-key=938bea3c-b707-43ce-a59f-1eb2695f759b";

export const PLATFORM_FEE_NUMBER = 5;
export const PLATFORM_FEE_PERCENT = PLATFORM_FEE_NUMBER / 100;
export const PLATFORM_FEE_ADDRESS = "6qMjXp8JVKPGXys9Fat9FsxLnZYrFWRSwbbcUTusibTy";


export const TRON_PLATFORM_FEE_NUMBER = 10;
export const TRON_PLATFORM_FEE_PERCENT = TRON_PLATFORM_FEE_NUMBER / 100;
export const TRON_PLATFORM_FEE_ADDRESS = 'TKPG9Y3PATFjJhDb4aRq2yWaMkmcQ43Yz4'
// Jito Auth Keypair
export const jitoAuthKeypair = "5kHEYKo1f5tVK7SH98SQJEaUJMdRHeKHVe1VHpTwCTw3m4rzqHyPBYrp89Z9Bw8e7jzTQWRtndGEVFzqQw8YWZKC";
// Block Engine URLS
export const nyBlockEngineUrl = 'amsterdam.mainnet.block-engine.jito.wtf';
export const amsterdamBlockEngineUrl = 'ny.mainnet.block-engine.jito.wtf';
export const frankfurtBlockEngineUrl = 'frankfurt.mainnet.block-engine.jito.wtf';
export const tokyoBlockEngineUrl = 'tokyo.mainnet.block-engine.jito.wtf';
// Tip Account]
export const JITO_TIP_MULTIPLIER = 5;

// Connection
export const connection = new Connection(heliusURL, "confirmed");
export const connectionProcessed = new Connection(heliusURL, "processed");
export const connectionHeliusFinalized = new Connection(heliusURL, "finalized");

export const PROGRAMIDS = MAINNET_PROGRAM_ID;
export const PROGRAMIDS_DEV = DEVNET_PROGRAM_ID
export const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;
export const makeTxVersion = TxVersion.V0; // LEGACY

export const addLookupTableInfo = LOOKUP_TABLE_CACHE // only mainnet. other = undefined

const decodedKey = bs58.decode(jitoAuthKeypair);
const keypair = Keypair.fromSecretKey(<Uint8Array>decodedKey);

const prio = { microLamports: 2_000_000 }; // prioritization fee
export const computeBudget = ComputeBudgetProgram.setComputeUnitPrice(prio)

const BLOCK_ENGINE_URLS = [
  frankfurtBlockEngineUrl,
  nyBlockEngineUrl,
  amsterdamBlockEngineUrl,
  tokyoBlockEngineUrl
]
const searcherClients: SearcherClient[] = [];

for (const url of BLOCK_ENGINE_URLS) {
  const authProvider = new AuthProvider(
    new AuthServiceClient(url, ChannelCredentials.createSsl()),
    keypair
  );
  const serviceClient = new SearcherServiceClient(
    url,
    ChannelCredentials.createSsl(),
    {interceptors: [authInterceptor(authProvider)], 'grpc.keepalive_timeout_ms': 4000}
  );

  const client = new SearcherClient(serviceClient);
  searcherClients.push(client);
}

let searcherClientIndex = 0;
export let searcherClient = searcherClients[searcherClientIndex]

export const shiftSearcherClient = () => {
  searcherClientIndex = (searcherClientIndex + 1) % searcherClients.length;
  searcherClient = searcherClients[searcherClientIndex];
}

export const getSearcherClient = () => {
  return searcherClient;
}

export const getSearcherClients = () => {
  return searcherClients;
}
export const DEFAULT_TOKEN = {
  'SOL': new Currency(9, 'USDC', 'USDC'),
  'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
  'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
  'RAY': new Token(TOKEN_PROGRAM_ID, new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
  'RAY_USDC-LP': new Token(TOKEN_PROGRAM_ID, new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
}

export const RayLiqPoolv4 = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')