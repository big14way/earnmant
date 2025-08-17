// scripts/clear-test-data.js - Clear test data from localStorage
console.log('🧹 Clearing test data...');

// This script would be run in the browser console to clear test data
const clearTestData = () => {
  try {
    const invoices = JSON.parse(localStorage.getItem('demo_invoices') || '{}');
    const realInvoices = {};
    
    Object.entries(invoices).forEach(([key, invoice]) => {
      // Keep invoices that don't start with 'test-'
      if (!invoice.invoiceId.startsWith('test-')) {
        realInvoices[key] = invoice;
      }
    });
    
    localStorage.setItem('demo_invoices', JSON.stringify(realInvoices));
    
    // Clear all portfolio data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('portfolio_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Test data cleared');
    console.log(`📋 Kept ${Object.keys(realInvoices).length} real invoices`);
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  }
};

// Run if in browser environment
if (typeof window !== 'undefined') {
  clearTestData();
} else {
  console.log('Run this in browser console: clearTestData()');
}
