
// Currency conversion rates
// 1 USD = X local currency
export const CURRENCY_RATES = {
  // Thai Baht conversion rates 
  THB: {
    KS_25000: 175, // 25000 Ks = 175 THB
    KS_20000: 150, // 20000 Ks = 150 THB
  }
};

// Function to convert from one currency to another
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === "KS" && toCurrency === "THB") {
    if (amount === 25000) return CURRENCY_RATES.THB.KS_25000;
    if (amount === 20000) return CURRENCY_RATES.THB.KS_20000;
  }
  
  // Default fallback using approximate exchange rate
  if (fromCurrency === "KS" && toCurrency === "THB") {
    return Math.round(amount * 0.007); // Approximate conversion rate
  }
  
  return amount; // Return original amount if no conversion is defined
}

// Format currency with symbol
export function formatCurrency(amount: number, currency: string): string {
  switch (currency) {
    case "USD":
      return `$${amount}`;
    case "THB":
      return `฿${amount}`;
    case "KS":
      return `${amount} Ks`;
    default:
      return `${amount}`;
  }
}
