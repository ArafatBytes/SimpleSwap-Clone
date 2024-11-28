// Cryptocurrency categories for SimpleSwap
export const cryptoCategories = {
  popular: [
    'BTC',  // Bitcoin
    'ETH',  // Ethereum
    'BNB',  // Binance Coin
    'SOL',  // Solana
    'XRP',  // Ripple
    'DOGE', // Dogecoin
    'ADA',  // Cardano
    'MATIC', // Polygon
    'DOT',  // Polkadot
    'AVAX'  // Avalanche
  ],
  new: [
    'OP',   // Optimism
    'IMX',  // ImmutableX
    'ROSE', // Oasis
    'AR',   // Arweave
    'LDO',  // Lido DAO
    'DYDX'  // dYdX
  ],
  gainers24h: [
    'SOL',  // Solana
    'AVAX', // Avalanche
    'MATIC', // Polygon
    'FTM',  // Fantom
    'NEAR', // NEAR Protocol
    'AXS'   // Axie Infinity
  ],
  losers24h: [
    'SHIB', // Shiba Inu
    'CAKE', // PancakeSwap
    'SAND', // The Sandbox
    'MANA', // Decentraland
    'FLOW', // Flow
    'THETA' // Theta Network
  ],
  stablecoins: [
    'USDT', // Tether
    'USDC', // USD Coin
    'DAI',  // Dai
    'BUSD'  // Binance USD
  ],
  defi: [
    'UNI',  // Uniswap
    'AAVE', // Aave
    'SUSHI', // SushiSwap
    'CAKE', // PancakeSwap
    '1INCH', // 1inch
    'CRV',  // Curve
    'SNX',  // Synthetix
    'COMP'  // Compound
  ],
  metaverse: [
    'SAND', // The Sandbox
    'MANA', // Decentraland
    'AXS',  // Axie Infinity
    'ENJ',  // Enjin
    'THETA', // Theta Network
    'IMX'   // ImmutableX
  ],
  layer1: [
    'BTC',  // Bitcoin
    'ETH',  // Ethereum
    'BNB',  // Binance Coin
    'SOL',  // Solana
    'ADA',  // Cardano
    'AVAX', // Avalanche
    'DOT',  // Polkadot
    'NEAR', // NEAR Protocol
    'FTM',  // Fantom
    'EGLD'  // Elrond
  ],
  layer2: [
    'MATIC', // Polygon
    'OP',    // Optimism
    'IMX',   // ImmutableX
    'DYDX'   // dYdX
  ],
  privacy: [
    'XMR',  // Monero
    'ZEC',  // Zcash
    'DASH'  // Dash
  ]
};

// Helper function to get coins by category
export const getCoinsByCategory = (category) => {
  return cryptoCategories[category] || [];
};

// Helper function to get all categories
export const getAllCategories = () => {
  return Object.keys(cryptoCategories);
};

// Helper function to check if a coin is in a category
export const isInCategory = (coin, category) => {
  return cryptoCategories[category]?.includes(coin) || false;
};

// Helper function to get all categories for a coin
export const getCoinCategories = (coin) => {
  return Object.entries(cryptoCategories)
    .filter(([_, coins]) => coins.includes(coin))
    .map(([category]) => category);
};
