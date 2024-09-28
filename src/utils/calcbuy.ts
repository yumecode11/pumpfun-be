const web3 = require('@solana/web3.js');

export type LiquidityPoolInfo = {
  initialSOL: number;
  tokensInLP: number;
  firstBuySOL: number;
};

export type PurchaseInfo = {
  initialSOL: number;
  tokensInLP: number;
  desiredPercentageOfSupply: number;
};

export function calculateBuyImpact(initialSOL: bigint, tokensInLP: bigint, firstBuySOL: bigint): { newSOL: bigint; newTokensInLP: bigint, tokensBought: bigint } {
  // Constant product before the purchase
  const k = initialSOL * tokensInLP;

  // New SOL amount in the liquidity pool after the purchase
  const newSOL = initialSOL + firstBuySOL;

  // New token amount in the liquidity pool after the purchase
  const newTokensInLP = k / newSOL;

  const tokensBought = tokensInLP - newTokensInLP;

  return {
    newSOL,
    newTokensInLP,
    tokensBought
  };
}

export function calculateSOLForDesiredPercentage({
  initialSOL,
  tokensInLP,
  desiredPercentageOfSupply,
}: PurchaseInfo) {
  // Calculate the desired amount of tokens
  const desiredTokens = (tokensInLP * desiredPercentageOfSupply);
  // Constant product before the purchase
  const k = initialSOL * tokensInLP;

  // Calculate the new amount of tokens in the liquidity pool after the purchase
  const newTokensInLP = tokensInLP - desiredTokens;

  // Ensure the purchase is possible (i.e., not trying to buy more tokens than available)
  if (newTokensInLP <= 0) {
    throw new Error("Desired percentage exceeds the pool's capacity.");
  }

  // Apply the constant product formula to find the new SOL amount
  const newSOL = k / newTokensInLP;

  // Calculate the amount of SOL required for the purchase
  return newSOL - initialSOL;
}

/**
 * Function to distribute a given total amount into an array of a specified length with randomness.
 * @param {number} totalAmount - The total amount to be distributed.
 * @param {number} length - The length of the output array.
 * @param {number} [randomFactor=0.3] - A factor to control the degree of randomness (higher values mean more variance).
 * @returns {number[]} An array with distributed amounts such that the sum equals the total amount.
 */
export function randomizeDistribution(
  totalAmount: number,
  length: number,
  randomFactor: number = 0.5
): number[] {
  if (length <= 0) {
    throw new Error("Length must be greater than zero.");
  }

  // Initialize the output array with equal distribution
  const initialValue = totalAmount / length;
  const distribution: number[] = Array(length).fill(initialValue);

  // Adjust the values with increased randomness
  for (let i = 0; i < length - 1; i++) {
    // Calculate the maximum adjustment based on the random factor
    const maxAdjustment = initialValue * randomFactor;

    // Generate a random adjustment within a broader range
    const adjustment = (Math.random() - 0.5) * 2 * maxAdjustment;

    // Adjust the current and next values, ensuring the sum stays consistent
    distribution[i] += adjustment;
    distribution[i + 1] -= adjustment;
  }

  return distribution;
}