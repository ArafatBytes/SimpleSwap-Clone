import WAValidator from 'wallet-address-validator';

// Currency network mapping (same as API)
const CURRENCY_NETWORKS = {
    btc: 'BTC',
    eth: 'ETH',
    usdterc20: 'ETH',
    usdt: 'ETH',
    bnb: 'BNB',
    busd: 'BNB',
    matic: 'MATIC',
    sol: 'SOL',
    trx: 'TRX',
    xrp: 'XRP',
    ltc: 'LTC',
    doge: 'DOGE',
    ada: 'ADA'
};

export const validateAddress = (address, currency) => {
    if (!address) return { isValid: false, message: 'Address is required' };
    if (!currency) return { isValid: false, message: 'Currency is required' };

    const network = CURRENCY_NETWORKS[currency.toLowerCase()];
    if (!network) {
        return { 
            isValid: false, 
            message: 'Unsupported currency network' 
        };
    }

    const isValid = WAValidator.validate(address, network);
    return {
        isValid,
        message: isValid ? '' : `Invalid ${network} network address`
    };
};
