// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title ChainlinkEnhancedPriceManager
 * @notice Enhanced price manager with Chainlink price feeds for African trade finance
 * @dev Supports commodity pricing, currency conversion, and risk assessment
 */
contract ChainlinkEnhancedPriceManager is ConfirmedOwner {
    
    // ============ PRICE FEED INTERFACES ============
    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public btcUsdFeed;
    AggregatorV3Interface public usdcUsdFeed;
    AggregatorV3Interface public linkUsdFeed;
    
    // ============ COMMODITY PRICE FEEDS ============
    // Note: These would be custom feeds or external API integrations
    mapping(string => int256) public commodityPrices; // commodity => price in USD (8 decimals)
    mapping(string => uint256) public commodityLastUpdate;
    
    // ============ CURRENCY CONVERSION ============
    mapping(string => int256) public currencyRates; // currency => rate to USD (8 decimals)
    mapping(string => uint256) public currencyLastUpdate;
    
    // ============ RISK ASSESSMENT DATA ============
    mapping(string => uint256) public countryRiskScores; // country => risk score (0-100)
    mapping(string => uint256) public commodityVolatility; // commodity => volatility score (0-100)
    
    // ============ STATE VARIABLES ============
    uint256 public constant PRICE_STALENESS_THRESHOLD = 3600; // 1 hour
    uint256 public constant COMMODITY_STALENESS_THRESHOLD = 86400; // 24 hours
    uint256 public constant DECIMALS = 8;
    
    // ============ EVENTS ============
    event PriceFeedUpdated(string indexed feedType, address indexed feedAddress);
    event CommodityPriceUpdated(string indexed commodity, int256 price, uint256 timestamp);
    event CurrencyRateUpdated(string indexed currency, int256 rate, uint256 timestamp);
    event CountryRiskUpdated(string indexed country, uint256 riskScore);
    event CommodityVolatilityUpdated(string indexed commodity, uint256 volatility);
    
    // ============ ERRORS ============
    error PriceFeedNotSet();
    error StalePrice();
    error InvalidPrice();
    error CommodityNotSupported(string commodity);
    error CurrencyNotSupported(string currency);
    
    constructor(
        address _ethUsdFeed,
        address _btcUsdFeed,
        address _usdcUsdFeed,
        address _linkUsdFeed
    ) ConfirmedOwner(msg.sender) {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        btcUsdFeed = AggregatorV3Interface(_btcUsdFeed);
        usdcUsdFeed = AggregatorV3Interface(_usdcUsdFeed);
        linkUsdFeed = AggregatorV3Interface(_linkUsdFeed);
        
        // Initialize African currencies (example rates)
        _initializeAfricanCurrencies();
        
        // Initialize commodity data
        _initializeCommodities();
        
        // Initialize country risk scores
        _initializeCountryRisks();
    }
    
    // ============ PRICE FEED FUNCTIONS ============
    
    /**
     * @notice Get latest ETH/USD price from Chainlink
     */
    function getEthUsdPrice() external view returns (int256 price, uint256 updatedAt) {
        if (address(ethUsdFeed) == address(0)) revert PriceFeedNotSet();
        
        (, int256 answer, , uint256 timestamp, ) = ethUsdFeed.latestRoundData();
        
        if (block.timestamp - timestamp > PRICE_STALENESS_THRESHOLD) revert StalePrice();
        if (answer <= 0) revert InvalidPrice();
        
        return (answer, timestamp);
    }
    
    /**
     * @notice Get latest BTC/USD price from Chainlink
     */
    function getBtcUsdPrice() external view returns (int256 price, uint256 updatedAt) {
        if (address(btcUsdFeed) == address(0)) revert PriceFeedNotSet();
        
        (, int256 answer, , uint256 timestamp, ) = btcUsdFeed.latestRoundData();
        
        if (block.timestamp - timestamp > PRICE_STALENESS_THRESHOLD) revert StalePrice();
        if (answer <= 0) revert InvalidPrice();
        
        return (answer, timestamp);
    }
    
    /**
     * @notice Get latest USDC/USD price from Chainlink
     */
    function getUsdcUsdPrice() external view returns (int256 price, uint256 updatedAt) {
        if (address(usdcUsdFeed) == address(0)) revert PriceFeedNotSet();
        
        (, int256 answer, , uint256 timestamp, ) = usdcUsdFeed.latestRoundData();
        
        if (block.timestamp - timestamp > PRICE_STALENESS_THRESHOLD) revert StalePrice();
        if (answer <= 0) revert InvalidPrice();
        
        return (answer, timestamp);
    }
    
    // ============ COMMODITY PRICING ============
    
    /**
     * @notice Get commodity price in USD
     * @param commodity The commodity name (e.g., "Coffee", "Cocoa", "Gold")
     */
    function getCommodityPrice(string memory commodity) external view returns (int256 price, uint256 updatedAt) {
        int256 storedPrice = commodityPrices[commodity];
        uint256 lastUpdate = commodityLastUpdate[commodity];
        
        if (storedPrice == 0) revert CommodityNotSupported(commodity);
        if (block.timestamp - lastUpdate > COMMODITY_STALENESS_THRESHOLD) revert StalePrice();
        
        return (storedPrice, lastUpdate);
    }
    
    /**
     * @notice Update commodity price (owner only)
     */
    function updateCommodityPrice(string memory commodity, int256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        
        commodityPrices[commodity] = price;
        commodityLastUpdate[commodity] = block.timestamp;
        
        emit CommodityPriceUpdated(commodity, price, block.timestamp);
    }
    
    // ============ CURRENCY CONVERSION ============
    
    /**
     * @notice Get currency exchange rate to USD
     * @param currency The currency code (e.g., "NGN", "GHS", "KES")
     */
    function getCurrencyRate(string memory currency) external view returns (int256 rate, uint256 updatedAt) {
        int256 storedRate = currencyRates[currency];
        uint256 lastUpdate = currencyLastUpdate[currency];
        
        if (storedRate == 0) revert CurrencyNotSupported(currency);
        if (block.timestamp - lastUpdate > COMMODITY_STALENESS_THRESHOLD) revert StalePrice();
        
        return (storedRate, lastUpdate);
    }
    
    /**
     * @notice Convert amount from local currency to USD
     */
    function convertToUsd(uint256 amount, string memory fromCurrency) external view returns (uint256) {
        (int256 rate, ) = this.getCurrencyRate(fromCurrency);
        return (amount * uint256(rate)) / (10 ** DECIMALS);
    }
    
    // ============ RISK ASSESSMENT ============
    
    /**
     * @notice Get country risk score (0-100, higher = riskier)
     */
    function getCountryRisk(string memory country) external view returns (uint256) {
        return countryRiskScores[country];
    }
    
    /**
     * @notice Get commodity volatility score (0-100, higher = more volatile)
     */
    function getCommodityVolatility(string memory commodity) external view returns (uint256) {
        return commodityVolatility[commodity];
    }
    
    /**
     * @notice Calculate comprehensive risk score for trade
     */
    function calculateTradeRisk(
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        uint256 amount
    ) external view returns (uint256 riskScore) {
        uint256 countryRisk = (countryRiskScores[supplierCountry] + countryRiskScores[buyerCountry]) / 2;
        uint256 commodityRisk = commodityVolatility[commodity];
        
        // Amount risk (higher amounts = higher risk)
        uint256 amountRisk = amount > 100000 * 10**6 ? 20 : (amount > 50000 * 10**6 ? 10 : 5);
        
        // Weighted risk calculation
        riskScore = (countryRisk * 40 + commodityRisk * 40 + amountRisk * 20) / 100;
        
        // Cap at 100
        if (riskScore > 100) riskScore = 100;
    }
    
    // ============ INITIALIZATION FUNCTIONS ============
    
    function _initializeAfricanCurrencies() private {
        // Nigerian Naira (NGN) - 1 USD = 800 NGN
        currencyRates["NGN"] = 80000000000; // 800 * 10^8
        currencyLastUpdate["NGN"] = block.timestamp;
        
        // Ghanaian Cedi (GHS) - 1 USD = 12 GHS  
        currencyRates["GHS"] = 1200000000; // 12 * 10^8
        currencyLastUpdate["GHS"] = block.timestamp;
        
        // Kenyan Shilling (KES) - 1 USD = 130 KES
        currencyRates["KES"] = 13000000000; // 130 * 10^8
        currencyLastUpdate["KES"] = block.timestamp;
        
        // South African Rand (ZAR) - 1 USD = 18 ZAR
        currencyRates["ZAR"] = 1800000000; // 18 * 10^8
        currencyLastUpdate["ZAR"] = block.timestamp;
    }
    
    function _initializeCommodities() private {
        // Coffee - $3.50 per lb
        commodityPrices["Coffee"] = 350000000; // 3.5 * 10^8
        commodityLastUpdate["Coffee"] = block.timestamp;
        commodityVolatility["Coffee"] = 25; // 25% volatility
        
        // Cocoa - $2,800 per metric ton
        commodityPrices["Cocoa"] = 280000000000; // 2800 * 10^8
        commodityLastUpdate["Cocoa"] = block.timestamp;
        commodityVolatility["Cocoa"] = 30; // 30% volatility
        
        // Gold - $2,000 per oz
        commodityPrices["Gold"] = 200000000000; // 2000 * 10^8
        commodityLastUpdate["Gold"] = block.timestamp;
        commodityVolatility["Gold"] = 15; // 15% volatility
        
        // Cotton - $0.75 per lb
        commodityPrices["Cotton"] = 75000000; // 0.75 * 10^8
        commodityLastUpdate["Cotton"] = block.timestamp;
        commodityVolatility["Cotton"] = 35; // 35% volatility

        // Cassava - $0.25 per kg (major African staple)
        commodityPrices["Cassava"] = 25000000; // 0.25 * 10^8
        commodityLastUpdate["Cassava"] = block.timestamp;
        commodityVolatility["Cassava"] = 20; // 20% volatility
    }
    
    function _initializeCountryRisks() private {
        // Low risk countries
        countryRiskScores["Kenya"] = 25;
        countryRiskScores["Ghana"] = 30;
        countryRiskScores["South Africa"] = 20;
        countryRiskScores["Botswana"] = 15;
        
        // Medium risk countries  
        countryRiskScores["Nigeria"] = 45;
        countryRiskScores["Ethiopia"] = 50;
        countryRiskScores["Tanzania"] = 35;
        countryRiskScores["Uganda"] = 40;
        
        // Buyer countries (typically lower risk)
        countryRiskScores["USA"] = 10;
        countryRiskScores["Germany"] = 8;
        countryRiskScores["UK"] = 12;
        countryRiskScores["Netherlands"] = 10;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function updatePriceFeed(string memory feedType, address feedAddress) external onlyOwner {
        if (keccak256(bytes(feedType)) == keccak256(bytes("ETH_USD"))) {
            ethUsdFeed = AggregatorV3Interface(feedAddress);
        } else if (keccak256(bytes(feedType)) == keccak256(bytes("BTC_USD"))) {
            btcUsdFeed = AggregatorV3Interface(feedAddress);
        } else if (keccak256(bytes(feedType)) == keccak256(bytes("USDC_USD"))) {
            usdcUsdFeed = AggregatorV3Interface(feedAddress);
        } else if (keccak256(bytes(feedType)) == keccak256(bytes("LINK_USD"))) {
            linkUsdFeed = AggregatorV3Interface(feedAddress);
        }
        
        emit PriceFeedUpdated(feedType, feedAddress);
    }
    
    function updateCountryRisk(string memory country, uint256 riskScore) external onlyOwner {
        require(riskScore <= 100, "Risk score must be <= 100");
        countryRiskScores[country] = riskScore;
        emit CountryRiskUpdated(country, riskScore);
    }
    
    function updateCommodityVolatility(string memory commodity, uint256 volatility) external onlyOwner {
        require(volatility <= 100, "Volatility must be <= 100");
        commodityVolatility[commodity] = volatility;
        emit CommodityVolatilityUpdated(commodity, volatility);
    }
}
