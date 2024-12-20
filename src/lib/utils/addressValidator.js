import WAValidator from "wallet-address-validator";
import bs58 from "bs58";

// Helper functions for address validation
const validateNearAddress = (address) => {
  try {
    // NEAR addresses must be at least 2 characters and at most 64 characters
    if (address.length < 2 || address.length > 64) return false;

    // NEAR addresses can only contain lowercase letters, digits, and special characters
    const validPattern =
      /^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/;
    return validPattern.test(address);
  } catch (error) {
    return false;
  }
};

const validateIotaAddress = (address) => {
  try {
    // IOTA addresses are 90 characters long and contain A-Z and 9
    const validPattern = /^[A-Z9]{90}$/;
    return validPattern.test(address);
  } catch (error) {
    return false;
  }
};

const validateMoneroAddress = (address) => {
  try {
    // Monero addresses start with 4 and are 95 characters long
    const validPattern =
      /^4[0-9AB][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{93}$/;
    return validPattern.test(address);
  } catch (error) {
    return false;
  }
};

const validateHarmonyAddress = (address) => {
  try {
    // Harmony addresses start with 'one1' and are 42 characters long
    return address.startsWith("one1") && address.length === 42;
  } catch (error) {
    return false;
  }
};

const validateIconAddress = (address) => {
  try {
    // ICON addresses start with 'hx' or 'cx' and are followed by 40 hex characters
    const validPattern = /^(hx|cx)[0-9a-f]{40}$/i;
    return validPattern.test(address);
  } catch (error) {
    return false;
  }
};

const validateOntologyAddress = (address) => {
  try {
    // Ontology addresses are base58 encoded and 34 characters long
    if (address.length !== 34) return false;

    try {
      const decoded = bs58.decode(address);
      return decoded.length === 25 && decoded[0] === 23; // Version byte for ONT is 23
    } catch {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Currency network mapping (comprehensive list)
const CURRENCY_NETWORKS = {
  // Bitcoin and Bitcoin-based
  btc: "BTC",
  ltc: "LTC",
  doge: "DOGE",
  dash: "DASH",
  bch: "BCH",
  zec: "ZEC",

  // Ethereum and ERC20 tokens
  eth: "ETH",
  usdterc20: "ETH",
  usdt: "ETH",
  usdc: "ETH",
  dai: "ETH",
  uni: "ETH",
  link: "ETH",
  shib: "ETH",
  wbtc: "ETH",
  aave: "ETH",
  matic: "ETH", // ERC20 MATIC

  // Binance Smart Chain
  bnb: "BNB",
  busd: "BNB",
  cake: "BNB",
  bake: "BNB",

  // Other Major Networks
  sol: "SOL",
  trx: "TRX",
  xrp: "XRP",
  ada: "ADA",
  dot: "DOT",
  avax: "AVAX",
  matic_polygon: "MATIC", // Native MATIC on Polygon
  atom: "ATOM",
  algo: "ALGO",
  xmr: "XMR",
  near: "NEAR",
  etc: "ETC",

  // Stablecoins on different networks
  usdttrc20: "TRX",
  usdtbep20: "BNB",
  usdcsol: "SOL",

  // Additional Networks
  ftm: "FTM",
  one: "ONE",
  waves: "WAVES",
  neo: "NEO",
  xtz: "XTZ",
  eos: "EOS",
  xlm: "XLM",
  iota: "IOTA",
  vet: "VET",
  icx: "ICX",
  zil: "ZIL",
  ont: "ONT",
  qtum: "QTUM",
};

export const validateAddress = (address, currency) => {
  if (!address) return { isValid: false, message: "Address is required" };
  if (!currency) return { isValid: false, message: "Currency is required" };

  const network = CURRENCY_NETWORKS[currency.toLowerCase()];

  if (!network) {
    return {
      isValid: false,
      message: "Unsupported currency network",
    };
  }

  try {
    let isValid = false;
    let message = "";

    // Handle special case validations
    switch (network) {
      case "XMR":
        isValid = validateMoneroAddress(address);
        message = isValid ? "" : "Invalid Monero address format";
        break;
      case "IOTA":
        isValid = validateIotaAddress(address);
        message = isValid ? "" : "Invalid IOTA address format";
        break;
      case "NEAR":
        isValid = validateNearAddress(address);
        message = isValid ? "" : "Invalid NEAR address format";
        break;
      case "ONE":
        isValid = validateHarmonyAddress(address);
        message = isValid ? "" : "Invalid Harmony ONE address format";
        break;
      case "ICX":
        isValid = validateIconAddress(address);
        message = isValid ? "" : "Invalid ICON address format";
        break;
      case "ONT":
        isValid = validateOntologyAddress(address);
        message = isValid ? "" : "Invalid Ontology address format";
        break;
      default:
        // Use WAValidator for other supported networks
        isValid = WAValidator.validate(address, network);
        message = isValid ? "" : `Invalid ${network} network address`;
    }

    return { isValid, message };
  } catch (error) {
    // Fallback for any validation errors
    console.error(`Validation error for ${currency}:`, error);
    return {
      isValid: false,
      message: `Unable to validate ${network} address. Please verify manually.`,
    };
  }
};
