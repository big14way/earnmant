// Simple verification that deployed contracts are working
const hre = require("hardhat");

async function main() {
    console.log('🔍 Verifying EarnX Protocol deployment on Mantle Sepolia...');
    
    const [deployer] = await hre.ethers.getSigners();
    console.log('📝 Using account:', deployer.address);

    // Contract addresses from recent deployment
    const CONTRACT_ADDRESSES = {
        PROTOCOL: "0xd592da75C554beD6b42766968Fee71e4C6A0d8b2",
        USDC: "0xa49Ae8a172017B6394310522c673A38d3D64b0A7",
        PRICE_MANAGER: "0xe468781867732309f62aCD0Fa6Fb00549Bf96299",
        VERIFICATION_MODULE: "0xe0af52d2056fd0D55f5F26275e6F3464582a37E9",
    };

    console.log('\n🔗 Testing contract connectivity...');
    
    try {
        // Test protocol contract
        const protocol = await hre.ethers.getContractAt("MantleEarnXProtocol", CONTRACT_ADDRESSES.PROTOCOL);
        const version = await protocol.version();
        console.log('✅ Protocol version:', version);
        
        const contractInfo = await protocol.getContractInfo();
        console.log('📋 Protocol info:');
        console.log('  Name:', contractInfo[0]);
        console.log('  Version:', contractInfo[1]);
        console.log('  Owner:', contractInfo[2]);
        console.log('  Paused:', contractInfo[3]);
        console.log('  Chain ID:', contractInfo[5].toString());

        // Test price manager
        const priceManager = await hre.ethers.getContractAt("ChainlinkEnhancedPriceManager", CONTRACT_ADDRESSES.PRICE_MANAGER);
        
        try {
            const coffeePrice = await priceManager.getCommodityPrice("Coffee");
            const price = coffeePrice[0].toString();
            const formattedPrice = (parseInt(price) / Math.pow(10, 8)).toFixed(2);
            console.log('☕ Coffee price available: $' + formattedPrice + ' per lb');
        } catch (e) {
            console.log('⚠️ Coffee price not set yet');
        }

        try {
            const kenyaRisk = await priceManager.getCountryRisk("Kenya");
            console.log('🇰🇪 Kenya risk score:', kenyaRisk.toString());
        } catch (e) {
            console.log('⚠️ Kenya risk data not available');
        }

        // Test USDC contract
        const usdc = await hre.ethers.getContractAt("MantleUSDC", CONTRACT_ADDRESSES.USDC);
        const name = await usdc.name();
        const symbol = await usdc.symbol();
        const decimals = await usdc.decimals();
        console.log('💰 USDC token:', name, '(' + symbol + ') with', decimals, 'decimals');

        // Test protocol stats
        const stats = await protocol.getProtocolStats();
        console.log('📊 Protocol Statistics:');
        console.log('  Total Invoices:', stats[0].toString());
        const fundsRaised = stats[1].toString();
        const formattedFunds = (parseInt(fundsRaised) / Math.pow(10, 6)).toFixed(2);
        console.log('  Total Funds Raised:', formattedFunds, 'USDC');
        console.log('  Pending:', stats[2].toString());
        console.log('  Verified:', stats[3].toString());
        console.log('  Funded:', stats[4].toString());
        console.log('  Repaid:', stats[5].toString());

        console.log('\n🎉 All contracts are working properly!');
        console.log('\n✅ Deployment verification successful!');
        console.log('🚀 EarnX Protocol with Chainlink is ready for use!');
        
        console.log('\n🔗 Contract Addresses (for frontend):');
        console.log('  PROTOCOL:', CONTRACT_ADDRESSES.PROTOCOL);
        console.log('  USDC:', CONTRACT_ADDRESSES.USDC);
        console.log('  PRICE_MANAGER:', CONTRACT_ADDRESSES.PRICE_MANAGER);
        console.log('  VERIFICATION_MODULE:', CONTRACT_ADDRESSES.VERIFICATION_MODULE);

    } catch (error) {
        console.error('❌ Contract verification failed:', error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });