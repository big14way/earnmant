const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing IPFSInvoiceProtocol contract...");
  
  try {
    // Get contract instance
    const contract = await hre.ethers.getContractAt(
      "IPFSInvoiceProtocol", 
      "0xc9632f562730AE5F56c2e5993b40460356b13674"
    );
    
    console.log("✅ Contract instance created");
    
    // Test basic read function
    const totalInvoices = await contract.getTotalInvoices();
    console.log("📊 Total invoices:", totalInvoices.toString());
    
    // Get signer for testing
    const [signer] = await hre.ethers.getSigners();
    console.log("🔑 Using signer:", signer.address);
    
    // Test contract write function with minimal parameters (no strings!)
    console.log("🚀 Testing invoice submission with IPFS hash...");
    
    // Convert IPFS hash to bytes32
    const ipfsHashString = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const ipfsHashBytes32 = await contract.stringToBytes32(ipfsHashString);
    console.log("🔗 IPFS hash as bytes32:", ipfsHashBytes32);
    
    const tx = await contract.submitInvoice(
      signer.address, // buyer (self for testing)
      hre.ethers.parseUnits("1000", 6), // 1,000 USDC (6 decimals)
      Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // dueDate (30 days from now)
      ipfsHashBytes32, // IPFS hash as bytes32
      {
        gasLimit: 80000000 // Still need high gas for Mantle Sepolia
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
        ipfsHash: invoice.ipfsHash,
        verified: invoice.verified,
        createdAt: new Date(Number(invoice.createdAt) * 1000).toISOString()
      });
    }
    
    console.log("🎉 IPFS Contract test completed successfully!");
    console.log("🔗 Transaction can be viewed at: https://sepolia.mantlescan.xyz/tx/" + tx.hash);
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    
    // Check if it's still a gas issue
    if (error.message.includes('gas')) {
      console.error("💡 Still a gas issue. Trying with higher gas...");
      console.error("Full error:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });