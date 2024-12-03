// SimpleSwap API integration with currency list and exchange rate calculation
const API_KEY = process.env.NEXT_PUBLIC_SIMPLESWAP_API_KEY?.trim();
const BASE_URL = 'https://api.simpleswap.io/v1';

// Fetch all available currencies from SimpleSwap API
export const getAllCurrencies = async () => {
  try {
    const url = `${BASE_URL}/get_all_currencies?api_key=${API_KEY}`;
    
    console.log('Fetching all currencies from SimpleSwap');
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.message || data.error || 'Failed to get currencies');
    }

    // Transform the API response into our currency format
    const currencies = data.map(currency => ({
      name: currency.name,
      symbol: currency.symbol,
      icon: currency.image,
      hasExternalId: currency.has_external_id,
      network: currency.network,
      networkName: currency.network_name
    }));

    console.log('Fetched currencies:', currencies.length);
    return currencies;
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    return [];
  }
};

// Map of currencies to their network-specific symbols
const CURRENCY_MAPPING = {
  'USDT': 'USDTERC20', // Use ERC20 version of USDT
  'USDC': 'USDCERC20', // Use ERC20 version of USDC
  'DAI': 'DAIERC20',   // Use ERC20 version of DAI
  'BTC': 'BTC',        // Bitcoin stays as is
  'ETH': 'ETH',        // Ethereum stays as is
  'BNB': 'BNBBSC',     // Use BSC version of BNB
  'MATIC': 'MATIC',    // Polygon MATIC
  'SOL': 'SOL',        // Solana
  'DOT': 'DOT',        // Polkadot
  'ADA': 'ADA'         // Cardano
};

export const getExchangeRate = async (fromCurrency, toCurrency, amount) => {
  try {
    if (!fromCurrency || !toCurrency || !amount || !API_KEY) {
      console.error('Missing required parameters or API key');
      return '';
    }

    // Get network-specific symbols
    const currency_from = CURRENCY_MAPPING[fromCurrency.toUpperCase()] || fromCurrency.toUpperCase();
    const currency_to = CURRENCY_MAPPING[toCurrency.toUpperCase()] || toCurrency.toUpperCase();
    
    // Get exchange rate using the correct endpoint format with query parameters
    const url = `${BASE_URL}/get_estimated?api_key=${API_KEY}&fixed=false&currency_from=${currency_from}&currency_to=${currency_to}&amount=${amount}`;
    
    console.log('Requesting exchange rate:', {
      currency_from,
      currency_to,
      amount,
      url: url.replace(API_KEY, '****')
    });

    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: data
    });

    if (response.status === 401) {
      throw new Error('Invalid API key');
    }

    if (!response.ok || data.error) {
      const message = data.message || data.error || 'Failed to get exchange rate';
      throw new Error(message);
    }

    // The API response is the estimated amount directly
    console.log('Raw API response:', data);
    return data ? data.toString() : '';
  } catch (error) {
    console.error('Exchange rate error:', error);
    return '';
  }
};
