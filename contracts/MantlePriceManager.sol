// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MantlePriceManager
 * @notice Simplified price manager for Mantle Network without Chainlink dependencies
 * @dev Uses fixed prices and manual updates for demo/testing purposes
 */
contract MantlePriceManager {
    
    // Price State (8 decimals like Chainlink)
    int256 public ethUsdPrice = 3200 * 10**8;   // $3,200 default
    int256 public usdcUsdPrice = 100000000;     // $1.00 default  
    int256 public btcUsdPrice = 65000 * 10**8;  // $65,000 default
    int256 public mntUsdPrice = 50000000;       // $0.50 default for MNT
    
    uint256 public lastUpdate;
    address public owner;
    
    event PricesUpdated(
        int256 ethPrice, 
        int256 usdcPrice, 
        int256 btcPrice,
        int256 mntPrice,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        lastUpdate = block.timestamp;
    }
    
    // ============ PRICE UPDATES ============
    function updatePrices(
        int256 _ethPrice,
        int256 _usdcPrice, 
        int256 _btcPrice,
        int256 _mntPrice
    ) external onlyOwner {
        require(_ethPrice > 0, "Invalid ETH price");
        require(_usdcPrice > 0, "Invalid USDC price");
        require(_btcPrice > 0, "Invalid BTC price");
        require(_mntPrice > 0, "Invalid MNT price");
        
        ethUsdPrice = _ethPrice;
        usdcUsdPrice = _usdcPrice;
        btcUsdPrice = _btcPrice;
        mntUsdPrice = _mntPrice;
        lastUpdate = block.timestamp;
        
        emit PricesUpdated(_ethPrice, _usdcPrice, _btcPrice, _mntPrice, block.timestamp);
    }
    
    function updateEthPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        ethUsdPrice = _price;
        lastUpdate = block.timestamp;
    }
    
    function updateUsdcPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        usdcUsdPrice = _price;
        lastUpdate = block.timestamp;
    }
    
    function updateBtcPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        btcUsdPrice = _price;
        lastUpdate = block.timestamp;
    }
    
    function updateMntPrice(int256 _price) external onlyOwner {
        require(_price > 0, "Invalid price");
        mntUsdPrice = _price;
        lastUpdate = block.timestamp;
    }
    
    // ============ PRICE GETTERS ============
    function getEthUsdPrice() external view returns (int256) {
        return ethUsdPrice;
    }
    
    function getUsdcUsdPrice() external view returns (int256) {
        return usdcUsdPrice;
    }
    
    function getBtcUsdPrice() external view returns (int256) {
        return btcUsdPrice;
    }
    
    function getMntUsdPrice() external view returns (int256) {
        return mntUsdPrice;
    }
    
    // ============ CHAINLINK-COMPATIBLE INTERFACE ============
    // For backward compatibility with existing code
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            ethUsdPrice, // answer (default to ETH price)
            lastUpdate, // startedAt
            lastUpdate, // updatedAt  
            1 // answeredInRound
        );
    }
    
    // ============ UTILITY FUNCTIONS ============
    function getAllPrices() external view returns (
        int256 eth,
        int256 usdc,
        int256 btc,
        int256 mnt,
        uint256 timestamp
    ) {
        return (ethUsdPrice, usdcUsdPrice, btcUsdPrice, mntUsdPrice, lastUpdate);
    }
    
    function convertUsdToToken(uint256 usdAmount, int256 tokenPrice) external pure returns (uint256) {
        require(tokenPrice > 0, "Invalid token price");
        // USD amount (6 decimals) * 10^8 / token price (8 decimals) = token amount (6 decimals)
        return (usdAmount * 10**8) / uint256(tokenPrice);
    }
    
    function convertTokenToUsd(uint256 tokenAmount, int256 tokenPrice) external pure returns (uint256) {
        require(tokenPrice > 0, "Invalid token price");
        // Token amount (variable decimals) * token price (8 decimals) / 10^8 = USD amount
        return (tokenAmount * uint256(tokenPrice)) / 10**8;
    }
    
    // ============ ADMIN FUNCTIONS ============
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
    
    // ============ VERSION INFO ============
    function version() external pure returns (string memory) {
        return "MantlePriceManager v1.0.0";
    }
    
    function getContractInfo() external view returns (
        string memory name,
        address owner_,
        uint256 lastUpdate_,
        uint256 priceCount
    ) {
        return (
            "Mantle Price Manager",
            owner,
            lastUpdate,
            4 // ETH, USDC, BTC, MNT
        );
    }
}