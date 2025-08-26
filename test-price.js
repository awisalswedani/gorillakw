// Test the formatPrice function
const config = {
  currency_list: [
    { id: 8, name: 'KD', symbol: 'KD', code: 'KD', exchange_rate: '1', status: true }
  ],
  decimal_point_settings: 2
};

function formatPrice(price, config) {
  if (!price || price <= 0) return '0 KD';
  
  try {
    // Get currency symbol from config, default to KD
    // The config structure has currency_list array with the active currency
    let currencySymbol = 'KD';
    let decimalPoints = 2;
    
    if (config) {
      // Find the active currency (status: true)
      const activeCurrency = config.currency_list?.find((curr) => curr.status === true);
      if (activeCurrency) {
        currencySymbol = activeCurrency.symbol || 'KD';
      }
      
      // Get decimal point settings
      decimalPoints = config.decimal_point_settings || 2;
    }
    
    // Format price with proper decimal places
    const formattedPrice = price.toFixed(decimalPoints);
    
    // Add thousand separators (comma)
    const priceWithCommas = formattedPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return formatted price with currency symbol (left side as per Flutter app)
    return `${currencySymbol} ${priceWithCommas}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${price.toFixed(2)} KD`;
  }
}

// Test cases
console.log('Testing formatPrice function:');
console.log('31.935483870968 ->', formatPrice(31.935483870968, config));
console.log('64.193548387097 ->', formatPrice(64.193548387097, config));
console.log('19.032258064516 ->', formatPrice(19.032258064516, config));
console.log('0 ->', formatPrice(0, config));
console.log('null ->', formatPrice(null, config)); 