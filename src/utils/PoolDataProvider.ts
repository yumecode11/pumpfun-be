import path from "path";
import fs from "fs";
import {PublicKey} from "@solana/web3.js";

export type DisperseWallet = {
  public: string
  mnemonic: string
  secret: string
}

export type PoolData  = {
  lookupTable: string | null
  keys: string[]
  wallets?: DisperseWallet[]
}

class PoolDataProvider {
  // TODO: Store it to database
  poolDataPath = path.resolve(__dirname, 'pool_data.json')
  poolData: Record<string, PoolData> = {};
  marketId: string = "";

  constructor(marketId: string) {
    if (!fs.existsSync(this.poolDataPath)) {
      fs.writeFileSync(this.poolDataPath, Buffer.from(
        JSON.stringify({})
      ));
    }

    // TODO: Replace to fetch from DB
    this.poolData = JSON.parse(fs.readFileSync(this.poolDataPath).toString());
    this.marketId = marketId;

    if (!this.poolData[this.marketId]) {
      this.poolData[this.marketId] = {
        lookupTable: null,
        keys: [],
        wallets: []
      };
      this.savePoolData();
    }
  }

  get poolInfo () {
    // TODO: Replace to fetch from DB
    this.poolData = JSON.parse(fs.readFileSync(this.poolDataPath).toString());
    return this.poolData[this.marketId];
  }

  get lookupTable () : string | null {
    return this.poolInfo.lookupTable;
  }

  set lookupTable (lookupTable: PublicKey) {
    const poolInfo = this.poolInfo;

    poolInfo.lookupTable = lookupTable.toString();
    this.poolData[this.marketId] = poolInfo;
    this.savePoolData();
  }

  get keys () : string[] {
    return this.poolInfo.keys;
  }

  set keys (keys: string[]) {
    const setKeys = new Set<string>();
    const poolInfo = this.poolInfo;

    keys.forEach(k => {
      setKeys.add(k);
    })

    poolInfo.keys = Array.from(setKeys);
    this.poolData[this.marketId] = poolInfo;
    this.savePoolData();
  }

  get disperseWallets () : DisperseWallet[] {
    return this.poolInfo.wallets || [];
  }

  set disperseWallets (wallets: DisperseWallet[]) {
    const setKeys = new Set<DisperseWallet>();
    const poolInfo = this.poolInfo;

    wallets.forEach(k => {
      setKeys.add(k);
    })

    poolInfo.wallets = Array.from(setKeys);
    this.poolData[this.marketId] = poolInfo;
    this.savePoolData();
  }

  savePoolData () {
    // TODO: Replace to Save to DB
    fs.writeFileSync(this.poolDataPath, Buffer.from(
      JSON.stringify(this.poolData)
    ))
  } 
}

export default PoolDataProvider;