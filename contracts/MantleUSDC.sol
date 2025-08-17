// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MantleUSDC
 * @notice USDC token contract for Mantle Network
 * @dev Production version should use the official USDC contract address on Mantle
 */
contract MantleUSDC {
    string public name = "USD Coin (Mantle)";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    
    address public owner;
    bool public paused = false;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public minters;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event Pause();
    event Unpause();
    event Blacklist(address indexed account);
    event UnBlacklist(address indexed account);
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Only minter");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        minters[msg.sender] = true;
        
        // Mint initial supply for testing (10M USDC)
        uint256 initialSupply = 10_000_000 * 10**decimals;
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
        emit MinterAdded(msg.sender);
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    function transfer(address to, uint256 amount) 
        public 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(to) 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) 
        public 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(spender) 
        returns (bool) 
    {
        require(spender != address(0), "Approve to zero address");
        
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        public 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(from) 
        notBlacklisted(to) 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) 
        public 
        onlyMinter 
        whenNotPaused 
        notBlacklisted(to) 
    {
        require(to != address(0), "Mint to zero address");
        require(amount > 0, "Amount must be positive");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount);
    }
    
    function burn(uint256 amount) public whenNotPaused notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be positive");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
        emit Burn(msg.sender, amount);
    }
    
    function burnFrom(address from, uint256 amount) 
        public 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(from) 
    {
        require(amount > 0, "Amount must be positive");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        totalSupply -= amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, address(0), amount);
        emit Burn(from, amount);
    }
    
    // Administrative functions
    function pause() public onlyOwner {
        paused = true;
        emit Pause();
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit Unpause();
    }
    
    function blacklistAccount(address account) public onlyOwner {
        require(account != address(0), "Cannot blacklist zero address");
        require(!blacklisted[account], "Already blacklisted");
        
        blacklisted[account] = true;
        emit Blacklist(account);
    }
    
    function unBlacklistAccount(address account) public onlyOwner {
        require(blacklisted[account], "Not blacklisted");
        
        blacklisted[account] = false;
        emit UnBlacklist(account);
    }
    
    function addMinter(address account) public onlyOwner {
        require(account != address(0), "Cannot add zero address as minter");
        require(!minters[account], "Already a minter");
        
        minters[account] = true;
        emit MinterAdded(account);
    }
    
    function removeMinter(address account) public onlyOwner {
        require(minters[account], "Not a minter");
        require(account != owner, "Cannot remove owner as minter");
        
        minters[account] = false;
        emit MinterRemoved(account);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        
        // Transfer minter role to new owner
        minters[newOwner] = true;
        minters[owner] = false;
        
        address oldOwner = owner;
        owner = newOwner;
        
        emit MinterRemoved(oldOwner);
        emit MinterAdded(newOwner);
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    // Utility functions for testing
    function mintToUser(address user, uint256 amount) external onlyOwner {
        mint(user, amount);
    }
    
    function faucet(uint256 amount) external whenNotPaused notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be positive");
        require(amount <= 1000 * 10**decimals, "Faucet limit exceeded"); // Max 1000 USDC per call
        
        mint(msg.sender, amount);
    }
    
    // View functions
    function version() external pure returns (string memory) {
        return "MantleUSDC v1.0.0";
    }
    
    function getContractInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        address owner_,
        bool paused_
    ) {
        return (name, symbol, decimals, totalSupply, owner, paused);
    }
    
    function isBlacklisted(address account) external view returns (bool) {
        return blacklisted[account];
    }
    
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
}