const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing SimpleInvoiceProtocol contract...");
  
  try {
    // Get contract instance
    const contract = await hre.ethers.getContractAt(
      "SimpleInvoiceProtocol", 
      "0x5A481F7dF0faA5c13Cae23a322544A0f873991F3"
    );
    
    console.log("✅ Contract instance created");
    
    // Test basic read function
    const totalInvoices = await contract.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    // Get signer for testing
    const [signer] = await hre.ethers.getSigners();
    console.log("🔑 Using signer:", signer.address);
    
    // Test contract write function with sample data
    console.log("🚀 Testing invoice submission...");
    
    const tx = await contract.submitInvoice(
      signer.address, // buyer (self for testing)
      hre.ethers.parseUnits("1000", 6), // 1,000 USDC (6 decimals) - smaller amount
      "Gold", // commodity
      "US", // supplierCountry - shorter
      "CA", // buyerCountry - shorter
      "ABC Ltd", // exporterName - shorter
      "XYZ Inc", // buyerName - shorter
      Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // dueDate (30 days from now)
      "0x123", // documentHash - much shorter
      {
        gasLimit: 100000000 // Use 100M gas
      }
    );
    
    console.log("⏳ Transaction submitted, hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Check total invoices again
    const newTotal = await contract.getTotalInvoices();
    console.log("📊 New total invoices:", newTotal.toString());
    
    // Get the invoice details
    if (newTotal > 0) {
      const invoice = await contract.getInvoice(newTotal);
      console.log("📄 Latest invoice:", {
        id: invoice.id.toString(),
        supplier: invoice.supplier,
        buyer: invoice.buyer,
        amount: hre.ethers.formatUnits(invoice.amount, 6) + " USDC",
        commodity: invoice.commodity,
        verified: invoice.verified
      });
    }
    
    console.log("🎉 Contract test completed successfully!");
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    
    // Log more details for debugging
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });