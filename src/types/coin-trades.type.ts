export type CoinTrade = {
  tradeId: string;
  coin_id: string;
  wallet: string;
  amount_in: number;
  amount_out: number;
  tx_hash: string;
  timestamp: Date;
};

export type CoinTradesArgs = {
  type: "buy" | "sell";
  coin: string;
  wallet: string;
  amount: string;
};

export type CoinTradesResponse = {
  code: number;
  message: string;
  data: CoinTrade | null;
};
