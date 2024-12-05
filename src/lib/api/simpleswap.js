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
  'BTC': 'btc',        // Bitcoin (case sensitive)
  'ETH': 'eth',        // Ethereum (case sensitive)
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
      return { rate: '', error: null };
    }

    // Get network-specific symbols
    const currency_from = CURRENCY_MAPPING[fromCurrency.toUpperCase()] || fromCurrency.toUpperCase();
    const currency_to = CURRENCY_MAPPING[toCurrency.toUpperCase()] || toCurrency.toUpperCase();
    
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
      return { rate: '', error: 'Invalid API key' };
    }

    // Check for the specific error format we're seeing
    if (data.error === 'Unprocessable Entity' && data.description && data.description.includes('Amount does not fall within the range')) {
      // Extract min amount from the description using regex
      const minMatch = data.description.match(/Min: ([0-9.]+)/);
      const minAmount = minMatch ? minMatch[1] : null;
      
      console.log('Extracted min amount:', minAmount);
      
      return {
        rate: '',
        error: 'MIN_AMOUNT',
        minAmount: minAmount,
        currency: currency_from
      };
    }

    if (data.error) {
      return { rate: '', error: data.error };
    }

    if (!response.ok) {
      return { rate: '', error: 'Failed to get exchange rate' };
    }

    return { rate: data.toString(), error: null };
  } catch (error) {
    console.error('Exchange rate error:', error);
    return { rate: '', error: error.message };
  }
};
