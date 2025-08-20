const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing MinimalInvoiceProtocol contract...");
  
  try {
    // Get contract instance
    const contract = await hre.ethers.getContractAt(
      "MinimalInvoiceProtocol", 
      "0x4b5d634b27CA72397fa8b9757332D2A5794632f5"
    );
    
    console.log("✅ Contract instance created");
    
    // Test basic read function
    const totalInvoices = await contract.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    // Get signer for testing
    const [signer] = await hre.ethers.getSigners();
    console.log("🔑 Using signer:", signer.address);
    
    // Test contract write function with sample data - start with very high gas
    console.log("🚀 Testing invoice submission...");
    
    const tx = await contract.submitInvoice(
      signer.address, // buyer (self for testing)
      hre.ethers.parseUnits("1000", 6), // 1,000 USDC (6 decimals)
      "Gold", // commodity
      "US", // supplierCountry
      "CA", // buyerCountry
      "ABC Ltd", // exporterName
      "XYZ Inc", // buyerName
      Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // dueDate (30 days from now)
      "0x123", // documentHash
      {
        gasLimit: 100000000 // Use very high gas for Mantle Sepolia
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
    
    console.log("🎉 Contract test completed successfully!");
    console.log("🔗 Transaction can be viewed at: https://sepolia.mantlescan.xyz/tx/" + tx.hash);
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    
    // Check if it's a gas issue again
    if (error.message.includes('gas')) {
      console.error("💡 This appears to be a gas-related issue. Trying with higher gas...");
      // Could retry with higher gas here
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });