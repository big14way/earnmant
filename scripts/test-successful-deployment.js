// Test the successful deployment contracts
const hre = require("hardhat");

async function main() {
    console.log('🧪 Testing successful deployment contracts...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using account:', deployer.address);
    
    // Contract addresses from successful deployment
    const CONTRACT_ADDRESSES = {
        PROTOCOL: "0x95EAb385c669aca31C0d406c270d6EdDFED0D1ee",
        USDC: "0x211a38792781b2c7a584a96F0e735d56e809fe85",
    };

    console.log('🌐 Network Info:');
    console.log('  Network Name:', hre.network.name);
    console.log('  Chain ID:', (await hre.ethers.provider.getNetwork()).chainId);
    
    console.log('\n📋 Step 1: Testing USDC Contract...');
    
    try {
        // Connect to USDC contract
        const usdc = await hre.ethers.getContractAt("MantleUSDC", CONTRACT_ADDRESSES.USDC);
        
        // Basic contract info
        const name = await usdc.name();
        const symbol = await usdc.symbol();
        const decimals = await usdc.decimals();
        console.log('✅ USDC Contract Info:');
        console.log('  Name:', name);
        console.log('  Symbol:', symbol);
        console.log('  Decimals:', decimals);
        
        // Check balance
        const usdcBalance = await usdc.balanceOf(deployer.address);
        console.log('  USDC Balance:', (Number(usdcBalance) / 1e6).toFixed(2), 'USDC');
        
    } catch (error) {
        console.error('❌ USDC Contract Test Failed:', error.message);
        return;
    }
    
    console.log('\n🏛️ Step 2: Testing Protocol Contract...');
    
    try {
        // Connect to protocol contract
        const protocol = await hre.ethers.getContractAt("MantleEarnXProtocol", CONTRACT_ADDRESSES.PROTOCOL);
        
        // Check protocol stats
        const protocolStats = await protocol.getProtocolStats();
        console.log('✅ Protocol Contract Info:');
        console.log('  Total invoices:', protocolStats[0].toString());
        console.log('  Total investments:', protocolStats[1].toString());
        console.log('  Total volume:', (Number(protocolStats[2]) / 1e6).toFixed(2), 'USDC');
        console.log('  Verified invoices:', protocolStats[3].toString());
        
        // Check version
        const version = await protocol.version();
        console.log('  Protocol Version:', version);
        
    } catch (error) {
        console.error('❌ Protocol Contract Test Failed:', error.message);
        return;
    }
    
    console.log('\n💳 Step 3: Testing USDC Approval...');
    
    try {
        const usdc = await hre.ethers.getContractAt("MantleUSDC", CONTRACT_ADDRESSES.USDC);
        const approvalAmount = hre.ethers.parseUnits("10", 6); // 10 USDC
        
        console.log('⏳ Submitting approval transaction for 10 USDC...');
        
        // Try the approval with correct gas settings
        const tx = await usdc.approve(CONTRACT_ADDRESSES.PROTOCOL, approvalAmount, {
            gasLimit: BigInt(160000000), // Use high gas limit as determined from diagnosis
        });
        
        console.log('✅ Approval Transaction Submitted!');
        console.log('  Transaction Hash:', tx.hash);
        console.log('  Explorer URL: https://explorer.sepolia.mantle.xyz/tx/' + tx.hash);
        
        console.log('⏳ Waiting for confirmation...');
        const receipt = await tx.wait();
        
        console.log('🎉 Approval Confirmed!');
        console.log('  Gas Used:', receipt.gasUsed.toString());
        console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
        
        // Verify the approval worked
        const newAllowance = await usdc.allowance(deployer.address, CONTRACT_ADDRESSES.PROTOCOL);
        console.log('✅ New Allowance:', (Number(newAllowance) / 1e6).toFixed(2), 'USDC');
        
    } catch (error) {
        console.error('❌ USDC Approval Failed:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('💡 Try running: npx hardhat run scripts/mint-usdc.js --network mantle-testnet');
        }
    }
    
    console.log('\n🏁 Contract test complete!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });