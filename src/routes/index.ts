// Auth
export { default as login } from "./auth/login";
export { default as logout } from "./auth/logout";
// export { default as verify } from './auth/verify'
export { default as session } from "./auth/session";

export { default as upload } from "./upload";

// Coins
export { default as createCoin } from "./coins/create-coin";
export { default as searchCoins } from "./coins/search-coins";
export { default as coin } from "./coins/coin";
export { default as topCoin } from "./coins/top-coin";
export { default as latestCoinCreated } from "./coins/latest-coin-created";

// Trades/Transactions
export { default as buy } from "./trades/buy";
export { default as sell } from "./trades/sell";
export { default as postComment } from "./trades/post-comment";
export { default as postContractAddress } from "./trades/post-contract-address";
export { default as latestTrades } from "./trades/latest-trades";

// Users
export { default as usersToFollow } from "./users/users-to-follow";
export { default as userProfile } from "./users/user-profile";
export { default as updateUserProfile } from "./users/update-user-profile";
export { default as follow } from "./users/follow";
