import WAValidator from 'wallet-address-validator';

export const validateAddress = async (address, currency) => {
  if (!address || !currency) return false;
  
  try {
    // Convert currency to lowercase for validation
    const currencyLower = currency.toLowerCase();
    
    // Special case for USDT since it can be on multiple chains
    if (currencyLower === 'usdt') {
      // Check if it's a valid ETH address (ERC20)
      const isEthAddress = WAValidator.validate(address, 'eth');
      // Check if it's a valid TRX address (TRC20)
      const isTrxAddress = WAValidator.validate(address, 'trx');
      return isEthAddress || isTrxAddress;
    }
    
    // For other currencies, validate directly
    return WAValidator.validate(address, currencyLower);
  } catch (error) {
    console.error('Address validation error:', error);
    return false;
  }
};
