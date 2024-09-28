import {PublicKey} from '@solana/web3.js';
import {PythHttpClient, getPythProgramKeyForCluster} from '@pythnetwork/client';
import {connection} from '../config';
import axios from 'axios';


export async function getSOLPrice() {
  // Connect to Solana mainnet
  // Initialize Pyth client
  const pythProgramKey = getPythProgramKeyForCluster('mainnet-beta');
  const pythClient = new PythHttpClient(connection, pythProgramKey);

  // SOL/USD price feed account on mainnet
  const solUsdPriceAccount = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

  try {
    let solPrice = null
    const priceData = await fetchCoinData('solana');
    if (priceData)
      solPrice = Number(priceData?.data.priceUsd).toFixed(2);
    if (priceData && solPrice)
      return Number(solPrice);
    const priceFeeds = await pythClient.getAssetPricesFromAccounts([solUsdPriceAccount]);

    if (priceFeeds && priceFeeds.length > 0) {
      const priceFeed = priceFeeds[0];
      const price = priceFeed.price;
      if (price !== undefined) {
        return Number(price.toFixed(2));
      } else {
        return 115.00;
      }
    } else {

      return 115.00;
    }
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 115.00;
  }
}

async function fetchCoinData(asset: string): Promise<CoinCapResponse | null> {
    try {
      const response = await axios.get<CoinCapResponse>(`https://api.coincap.io/v2/assets/${asset}`);
      console.log(response.data.data.priceUsd);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      return null;
    }
  }

  interface CoinCapResponse {
    data: {
      id: string;
      rank: string;
      symbol: string;
      name: string;
      supply: string;
      maxSupply: string | null;
      marketCapUsd: string;
      volumeUsd24Hr: string;
      priceUsd: string;
      changePercent24Hr: string;
      vwap24Hr: string;
    };
    timestamp: number;
  }