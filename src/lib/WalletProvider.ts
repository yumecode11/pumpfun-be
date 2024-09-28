import {PublicKey} from "@solana/web3.js";
import { supabase } from '../db/utils';
import logger from "../utils/logger";


class WalletProvider {
  _tokenAddress: string = '';
  _wallets: string[] = [];

  constructor(tokenAddress: PublicKey) {
    this._tokenAddress = tokenAddress.toString();
    this.fetchWallets();
  }

  async fetchWallets() {
    const { data, error } = await supabase
      .from('tokens') // Your Supabase table name
      .select('wallets')
      .eq('tokenAddress', this._tokenAddress)
      .maybeSingle()

    if (error) {
      throw new Error(`Error fetching token data: ${error.message}`);
    }

    // If no data, initialize it
    if (data) {
      this._wallets = data.wallets || [];
    }
  }

  set wallets (_wallets: string[]) {
    this._wallets = [...(new Set(_wallets))];
  }

  get wallets () {
    return this._wallets
  }

  async saveWallets() {
    logger.info('Saving wallets', {
      tokenAddress: this._tokenAddress,
      walletsLength: this._wallets.length
    })
    const { error, data } = await supabase
      .from('tokens')
      .update({
        wallets: this._wallets
      })
      .eq('tokenAddress', this._tokenAddress)
      .select()

    if (error) {
      throw new Error(`Error saving wallets: ${error.message}`);
    }
  }
}
export default WalletProvider;