const fs = require('fs');
const https = require('https');
const path = require('path');

const cryptoIcons = [
  { symbol: 'BTC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/btc.svg' },
  { symbol: 'ETH', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
  { symbol: 'USDT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
  { symbol: 'BNB', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
  { symbol: 'SOL', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sol.svg' },
  { symbol: 'XRP', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xrp.svg' },
  { symbol: 'USDC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
  { symbol: 'ADA', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ada.svg' },
  { symbol: 'AVAX', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/avax.svg' },
  { symbol: 'DOGE', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg' },
  { symbol: 'DOT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dot.svg' },
  { symbol: 'MATIC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
  { symbol: 'DAI', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dai.svg' },
  { symbol: 'UNI', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/uni.svg' },
  { symbol: 'LINK', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/link.svg' },
  { symbol: 'ATOM', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/atom.svg' },
  { symbol: 'LTC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ltc.svg' },
  { symbol: 'BCH', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bch.svg' },
  { symbol: 'ALGO', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/algo.svg' },
  { symbol: 'XLM', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xlm.svg' },
];

const iconDir = path.join(__dirname, '..', 'public', 'crypto-icons');

// Create directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Download each icon
cryptoIcons.forEach(({ symbol, url }) => {
  const filePath = path.join(iconDir, `${symbol.toLowerCase()}.svg`);
  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const file = fs.createWriteStream(filePath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${symbol} icon`);
      });
    } else {
      console.error(`Failed to download ${symbol} icon: ${response.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`Error downloading ${symbol} icon:`, err.message);
  });
});
