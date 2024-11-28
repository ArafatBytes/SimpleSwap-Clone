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
  { symbol: 'TRX', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/trx.svg' },
  { symbol: 'VET', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/vet.svg' },
  { symbol: 'FIL', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/fil.svg' },
  { symbol: 'AAVE', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/aave.svg' },
  { symbol: 'EOS', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eos.svg' },
  { symbol: 'XTZ', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xtz.svg' },
  { symbol: 'THETA', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/theta.svg' },
  { symbol: 'SAND', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sand.svg' },
  { symbol: 'MANA', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/mana.svg' },
  { symbol: 'XMR', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/xmr.svg' },
  { symbol: 'ENJ', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/enj.svg' },
  { symbol: 'CHZ', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/chz.svg' },
  { symbol: 'ONE', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/one.svg' },
  { symbol: 'HOT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/hot.svg' },
  { symbol: 'BAT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bat.svg' },
  { symbol: 'ZIL', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/zil.svg' },
  { symbol: 'DASH', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dash.svg' },
  { symbol: 'NEO', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/neo.svg' },
  { symbol: 'WAVES', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/waves.svg' },
  { symbol: 'QTUM', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/qtum.svg' },
  { symbol: 'ZEC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/zec.svg' },
  { symbol: 'BTT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/btt.svg' },
  { symbol: 'RVN', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/rvn.svg' },
  { symbol: 'ONT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ont.svg' },
  { symbol: 'ZRX', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/zrx.svg' },
  { symbol: 'ICX', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/icx.svg' },
  { symbol: 'SC', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sc.svg' },
  { symbol: 'NANO', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/nano.svg' },
  { symbol: 'DGB', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dgb.svg' },
  { symbol: 'ANKR', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/ankr.svg' },
  { symbol: 'COMP', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/comp.svg' },
  { symbol: 'SNX', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/snx.svg' },
  { symbol: 'CRV', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/crv.svg' },
  { symbol: 'SUSHI', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/sushi.svg' },
  { symbol: '1INCH', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/1inch.svg' },
  { symbol: 'GRT', url: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/grt.svg' },
  { symbol: 'SHIB', url: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { symbol: 'FTM', url: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png' },
  { symbol: 'NEAR', url: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg' },
  { symbol: 'CAKE', url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7186.png' },
  { symbol: 'FLOW', url: 'https://assets.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png' },
  { symbol: 'AXS', url: 'https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png' },
  { symbol: 'EGLD', url: 'https://assets.coingecko.com/coins/images/12335/small/egld-token-logo.png' },
  { symbol: 'HBAR', url: 'https://assets.coingecko.com/coins/images/3688/small/hbar.png' },
  { symbol: 'IOTA', url: 'https://assets.coingecko.com/coins/images/692/small/IOTA_Swirl.png' },
  { symbol: 'LUNA', url: 'https://assets.coingecko.com/coins/images/8284/small/01_LunaClassic_color.png' },
  { symbol: 'AR', url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5632.png' },
  { symbol: 'ROSE', url: 'https://assets.coingecko.com/coins/images/13162/small/rose.png' },
  { symbol: 'IMX', url: 'https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png' },
  { symbol: 'LDO', url: 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png' },
  { symbol: 'OP', url: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png' },
  { symbol: 'DYDX', url: 'https://assets.coingecko.com/coins/images/17500/small/hjnIm9bV.jpg' }
];

const iconDir = path.join(__dirname, '..', 'public', 'crypto-icons');

// Create the directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Download function
const downloadIcon = (symbol, url) => {
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
};

// Download all icons
cryptoIcons.forEach(({ symbol, url }) => {
  downloadIcon(symbol, url);
});
