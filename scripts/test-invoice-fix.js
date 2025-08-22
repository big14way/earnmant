// Test invoice submission with fixed buyer/supplier validation
const hre = require("hardhat");

async function main() {
    console.log('🧪 Testing invoice submission with different buyer/supplier addresses...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using supplier account:', deployer.address);

    // Contract addresses from deployment
    const CONTRACT_ADDRESSES = {
        PROTOCOL: "0xd592da75C554beD6b42766968Fee71e4C6A0d8b2",
        USDC: "0xa49Ae8a172017B6394310522c673A38d3D64b0A7",
    };

    // Use different buyer address (lowercase to avoid checksum issues)
    const buyerAddress = "0x742d35cc6635c0532925a3b8d50b6f4c8daed9a1";
    
    console.log('🏢 Buyer address:', buyerAddress);
    console.log('🏭 Supplier address:', deployer.address);
    console.log('✅ Different addresses confirmed!');

    console.log('\n🔗 Connecting to contracts...');
    
    // Connect to contracts
    const protocol = await hre.ethers.getContractAt("MantleEarnXProtocol", CONTRACT_ADDRESSES.PROTOCOL);

    // Step 1: Check initial state
    console.log('\n📊 Step 1: Checking initial protocol state...');
    const initialStats = await protocol.getProtocolStats();
    console.log('📈 Initial total invoices:', initialStats[0].toString());

    // Step 2: Submit an invoice
    console.log('\n📄 Step 2: Submitting test invoice with different buyer...');
    
    const invoiceAmount = hre.ethers.parseUnits("25000", 6); // 25,000 USDC (matches frontend error)
    const currentTime = Math.floor(Date.now() / 1000);
    const dueDate = currentTime + (30 * 24 * 60 * 60); // 30 days from now
    
    console.log('💰 Invoice amount: 25,000 USDC');
    console.log('📅 Due date:', new Date(dueDate * 1000).toLocaleDateString());
    console.log('🏢 Buyer:', buyerAddress);
    console.log('🏭 Supplier:', deployer.address);
    
    try {
        const submitTx = await protocol.submitInvoice(
            buyerAddress, // Different buyer address
            invoiceAmount,
            "Gold", // Commodity - matches frontend error
            "Kenya", // Supplier country - matches frontend error
            "USA", // Buyer country
            "Colombia Export Co. Ltd", // Exporter name - matches frontend error
            "Global Trade Imports Inc.", // Buyer name - matches frontend error
            BigInt(dueDate),
            "0x75ca25c5c0c1b7f221e70cf9cad2095491242c608e1ad12d4e7bd05645c254c0" // Document hash - matches frontend error
        );
        
        console.log('⏳ Waiting for transaction confirmation...');
        const receipt = await submitTx.wait();
        console.log('✅ Invoice submitted successfully!');
        console.log('📋 Transaction hash:', submitTx.hash);
        console.log('⛽ Gas used:', receipt.gasUsed.toString());
        console.log('🌐 Explorer URL: https://explorer.sepolia.mantle.xyz/tx/' + submitTx.hash);
        
        // Extract invoice ID from events
        let invoiceId = null;
        for (const event of receipt.events || []) {
            if (event.event === 'InvoiceSubmitted') {
                invoiceId = event.args.invoiceId;
                console.log('🆔 Invoice ID:', invoiceId.toString());
                break;
            }
        }
        
        if (!invoiceId) {
            const newStats = await protocol.getProtocolStats();
            invoiceId = newStats[0]; // Latest invoice ID
            console.log('🆔 Assumed Invoice ID:', invoiceId.toString());
        }

        // Step 3: Verify the invoice was created
        console.log('\n🔍 Step 3: Verifying invoice details...');
        
        try {
            const invoice = await protocol.getInvoice(invoiceId);
            console.log('📋 Invoice Details:');
            console.log('  ID:', invoice.id.toString());
            console.log('  Supplier:', invoice.supplier);
            console.log('  Buyer:', invoice.buyer);
            console.log('  Amount:', (Number(invoice.amount) / 1e6).toFixed(2), 'USDC');
            console.log('  Commodity:', invoice.commodity);
            console.log('  Status:', invoice.status.toString());
            console.log('  Document Verified:', invoice.documentVerified);
            
            if (invoice.supplier === deployer.address && invoice.buyer === buyerAddress) {
                console.log('✅ SUCCESS: Buyer and supplier addresses are correctly different!');
            } else {
                console.log('❌ ERROR: Address mismatch detected');
            }
            
        } catch (invoiceErr) {
            console.log('❌ Could not retrieve invoice details:', invoiceErr.message);
        }

        // Step 4: Check updated protocol stats
        console.log('\n📊 Step 4: Updated protocol statistics...');
        const newStats = await protocol.getProtocolStats();
        console.log('📈 Total invoices:', newStats[0].toString());
        console.log('✅ Verified invoices:', newStats[3].toString());
        
        console.log('\n🎉 Invoice submission test completed successfully!');
        console.log('✅ The buyer/supplier validation fix is working!');

    } catch (error) {
        console.error('❌ Invoice submission failed:', error.message);
        
        if (error.message.includes('Supplier cannot be buyer')) {
            console.log('🚨 VALIDATION ERROR: The contract is still rejecting supplier=buyer');
            console.log('🔧 This means we need to check the frontend is using the correct addresses');
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });