// Test the formatPrice function with actual config data and currency conversion
const config = {
  currency_list: [
    { id: 1, name: 'USD', symbol: '$', code: 'USD', exchange_rate: '3.22580645161289991663', status: false },
    { id: 8, name: 'KD', symbol: 'KD', code: 'KD', exchange_rate: '1', status: true }
  ],
  decimal_point_settings: 2
};

function formatPrice(price, config) {
  if (!price || price <= 0) return '0 KD';
  
  try {
    // Get currency symbol from config, default to KD
    let currencySymbol = 'KD';
    let decimalPoints = 2;
    let convertedPrice = price;
    
    if (config) {
      // Find the active currency (status: true)
      const activeCurrency = config.currency_list?.find((curr) => curr.status === true);
      // Find the USD currency (status: false, code: USD)
      const usdCurrency = config.currency_list?.find((curr) => curr.status === false && curr.code === 'USD');
      
      if (activeCurrency) {
        currencySymbol = activeCurrency.symbol || 'KD';
        const activeRate = parseFloat(activeCurrency.exchange_rate) || 1;
        const usdRate = parseFloat(usdCurrency?.exchange_rate) || 1;
        
        // Apply currency conversion: price * activeRate * (1 / usdRate)
        // This matches the Flutter app's conversion logic
        convertedPrice = price * activeRate * (1 / usdRate);
      }
      
      // Get decimal point settings
      decimalPoints = config.decimal_point_settings || 2;
    }
    
    // Format price with proper decimal places and commas
    const formattedPrice = convertedPrice.toFixed(decimalPoints);
    const priceWithCommas = formattedPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${currencySymbol} ${priceWithCommas}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${price.toFixed(2)} KD`;
  }
}

console.log('Testing updated formatPrice function with currency conversion:');
console.log('31.935483870968 ->', formatPrice(31.935483870968, config));
console.log('64.193548387097 ->', formatPrice(64.193548387097, config));
console.log('19.032258064516 ->', formatPrice(19.032258064516, config));
console.log('19.193548387097 ->', formatPrice(19.193548387097, config));
console.log('0.032258064516129 ->', formatPrice(0.032258064516129, config));

// Test with actual product prices from the logs
console.log('Testing formatPrice function with actual data:');
console.log('Config:', JSON.stringify(config, null, 2));
console.log('Active currency:', config.currency_list.find(curr => curr.status === true));

const testPrices = [
  31.935483870968,
  64.193548387097,
  19.032258064516,
  19.193548387097,
  0.032258064516129
];

testPrices.forEach(price => {
  const formatted = formatPrice(price, config);
  console.log(`${price} -> ${formatted}`);
});

// Test without config (should default to KD)
console.log('\nTesting without config:');
testPrices.forEach(price => {
  const formatted = formatPrice(price, null);
  console.log(`${price} -> ${formatted}`);
}); 