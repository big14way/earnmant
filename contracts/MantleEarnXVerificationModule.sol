// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MantleEarnXVerificationModule
 * @notice EIP-712 based invoice verification for Mantle Network
 * @dev Replaces Chainlink Functions with signature-based verification
 */
contract MantleEarnXVerificationModule {
    
    // ============ EIP-712 DOMAIN ============
    string private constant SIGNING_DOMAIN = "EarnX";
    string private constant SIGNATURE_VERSION = "1";
    
    // ============ STATE VARIABLES ============
    address public coreContract;
    address public verificationAuthority;
    address public owner;
    
    // ============ STRUCTS ============
    struct InvoiceVerification {
        uint256 invoiceId;
        string documentHash;
        string commodity;
        uint256 amount;
        string supplierCountry;
        string buyerCountry;
        string exporterName;
        string buyerName;
        uint256 deadline;
        uint256 nonce;
    }
    
    struct VerificationResult {
        bool isValid;
        uint256 riskScore;
        string creditRating;
        uint256 timestamp;
        bytes signature;
    }
    
    // ============ STORAGE ============
    mapping(uint256 => bool) public isVerified;
    mapping(uint256 => bool) public isValid;
    mapping(uint256 => uint256) public riskScore;
    mapping(uint256 => string) public creditRating;
    mapping(uint256 => string) public verificationDetails;
    mapping(uint256 => uint256) public verificationTimestamp;
    mapping(address => uint256) public nonces;
    
    // ============ EVENTS ============
    event DocumentVerificationRequested(uint256 indexed invoiceId, string documentHash);
    event DocumentVerificationCompleted(uint256 indexed invoiceId, bool isValid, uint256 riskScore);
    event VerificationAuthorityUpdated(address indexed oldAuthority, address indexed newAuthority);
    
    // ============ MODIFIERS ============
    modifier onlyCoreContract() {
        require(msg.sender == coreContract, "Only core contract");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    constructor(address _verificationAuthority) {
        owner = msg.sender;
        verificationAuthority = _verificationAuthority;
    }
    
    function setCoreContract(address _coreContract) external onlyOwner {
        require(coreContract == address(0), "Core contract already set");
        coreContract = _coreContract;
    }
    
    function setVerificationAuthority(address _newAuthority) external onlyOwner {
        require(_newAuthority != address(0), "Invalid authority address");
        address oldAuthority = verificationAuthority;
        verificationAuthority = _newAuthority;
        emit VerificationAuthorityUpdated(oldAuthority, _newAuthority);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner address");
        owner = _newOwner;
    }
    
    // ============ EIP-712 FUNCTIONS ============
    function _domainSeparatorV4() internal view returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(SIGNING_DOMAIN)),
            keccak256(bytes(SIGNATURE_VERSION)),
            block.chainid,
            address(this)
        ));
    }
    
    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparatorV4(), structHash));
    }
    
    function _hashInvoiceVerification(InvoiceVerification memory verification) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("InvoiceVerification(uint256 invoiceId,string documentHash,string commodity,uint256 amount,string supplierCountry,string buyerCountry,string exporterName,string buyerName,uint256 deadline,uint256 nonce)"),
            verification.invoiceId,
            keccak256(bytes(verification.documentHash)),
            keccak256(bytes(verification.commodity)),
            verification.amount,
            keccak256(bytes(verification.supplierCountry)),
            keccak256(bytes(verification.buyerCountry)),
            keccak256(bytes(verification.exporterName)),
            keccak256(bytes(verification.buyerName)),
            verification.deadline,
            verification.nonce
        ));
    }
    
    // ============ VERIFICATION FUNCTIONS ============
    function startDocumentVerification(
        uint256 invoiceId,
        string memory documentHash,
        string memory commodity,
        uint256 amount,
        string memory supplierCountry,
        string memory /* buyerCountry */,
        string memory /* exporterName */,
        string memory /* buyerName */
    ) external onlyCoreContract returns (bytes32) {
        
        emit DocumentVerificationRequested(invoiceId, documentHash);
        
        // For demonstration, we'll auto-verify based on simple heuristics
        // In production, this would wait for off-chain signature
        _autoVerify(invoiceId, commodity, amount, supplierCountry);
        
        return keccak256(abi.encodePacked(invoiceId, documentHash, block.timestamp));
    }
    
    function verifyWithSignature(
        InvoiceVerification memory verification,
        bool _isValid,
        uint256 _riskScore,
        string memory _creditRating,
        bytes memory signature
    ) external {
        require(block.timestamp <= verification.deadline, "Verification deadline passed");
        require(verification.nonce == nonces[verificationAuthority], "Invalid nonce");
        require(!isVerified[verification.invoiceId], "Already verified");
        
        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(_hashInvoiceVerification(verification));
        address signer = _recoverSigner(digest, signature);
        require(signer == verificationAuthority, "Invalid signature");
        
        // Update nonce to prevent replay attacks
        nonces[verificationAuthority]++;
        
        // Store verification result
        isVerified[verification.invoiceId] = true;
        isValid[verification.invoiceId] = _isValid;
        riskScore[verification.invoiceId] = _riskScore;
        creditRating[verification.invoiceId] = _creditRating;
        verificationTimestamp[verification.invoiceId] = block.timestamp;
        
        if (_isValid) {
            verificationDetails[verification.invoiceId] = "EIP-712 signature verification passed";
        } else {
            verificationDetails[verification.invoiceId] = "EIP-712 signature verification failed";
        }
        
        emit DocumentVerificationCompleted(verification.invoiceId, _isValid, _riskScore);
        
        // Notify core contract
        if (coreContract != address(0)) {
            try IEarnXCore(coreContract).onDocumentVerificationComplete(
                verification.invoiceId, 
                _isValid, 
                _riskScore, 
                _creditRating
            ) {
                // Success
            } catch {
                // Failed but continue
            }
        }
    }
    
    // ============ AUTO VERIFICATION (FOR DEMO) ============
    function _autoVerify(
        uint256 invoiceId,
        string memory commodity,
        uint256 amount,
        string memory supplierCountry
    ) internal {
        bool valid = true;
        uint256 risk = 25; // Default low risk
        string memory rating = "A";
        
        // Simple risk assessment heuristics
        bytes32 commodityHash = keccak256(bytes(_toLower(commodity)));
        
        if (commodityHash == keccak256(bytes("gold")) || 
            commodityHash == keccak256(bytes("coffee")) ||
            commodityHash == keccak256(bytes("tea"))) {
            risk = 20; // Lower risk for established commodities
        } else if (commodityHash == keccak256(bytes("spices")) ||
                   commodityHash == keccak256(bytes("cotton"))) {
            risk = 35; // Higher risk for volatile commodities
            rating = "B";
        }
        
        // Amount-based risk adjustment
        if (amount > 100000 * 10**6) { // > $100k (assuming 6 decimals)
            risk += 15;
        }
        
        // Country-based risk (simplified)
        bytes32 countryHash = keccak256(bytes(_toLower(supplierCountry)));
        if (countryHash == keccak256(bytes("kenya")) ||
            countryHash == keccak256(bytes("ghana")) ||
            countryHash == keccak256(bytes("brazil"))) {
            // Lower risk countries
            risk = risk > 5 ? risk - 5 : risk;
        }
        
        // Ensure risk stays within bounds
        if (risk > 75) {
            valid = false;
            risk = 85;
            rating = "D";
        } else if (risk > 50) {
            rating = "C";
        } else if (risk > 35) {
            rating = "B";
        }
        
        // Store results
        isVerified[invoiceId] = true;
        isValid[invoiceId] = valid;
        riskScore[invoiceId] = risk;
        creditRating[invoiceId] = rating;
        verificationTimestamp[invoiceId] = block.timestamp;
        verificationDetails[invoiceId] = valid ? 
            "Auto-verification based on risk heuristics" : 
            "Auto-verification failed - high risk";
        
        emit DocumentVerificationCompleted(invoiceId, valid, risk);
        
        // Notify core contract (re-enabled for Chainlink integration testing)
        if (coreContract != address(0)) {
            try IEarnXCore(coreContract).onDocumentVerificationComplete(
                invoiceId,
                valid,
                risk,
                rating
            ) {
                // Success
            } catch {
                // Failed but continue
            }
        }
    }
    
    // ============ HELPER FUNCTIONS ============
    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        return _recoverSigner(digest, signature, 0);
    }
    
    function _recoverSigner(bytes32 digest, bytes memory signature, uint256 offset) internal pure returns (address) {
        if (signature.length < 65) return address(0);
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, add(0x20, offset)))
            s := mload(add(signature, add(0x40, offset)))
            v := byte(0, mload(add(signature, add(0x60, offset))))
        }
        
        if (v < 27) v += 27;
        
        if (v != 27 && v != 28) return address(0);
        
        return ecrecover(digest, v, r, s);
    }
    
    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        for (uint i = 0; i < strBytes.length; i++) {
            if (strBytes[i] >= 0x41 && strBytes[i] <= 0x5A) {
                strBytes[i] = bytes1(uint8(strBytes[i]) + 32);
            }
        }
        return string(strBytes);
    }
    
    // ============ VIEW FUNCTIONS ============
    function getDocumentVerification(uint256 invoiceId) external view returns (
        bool verified,
        bool valid,
        string memory details,
        uint256 risk,
        string memory rating,
        uint256 timestamp
    ) {
        return (
            isVerified[invoiceId],
            isValid[invoiceId],
            verificationDetails[invoiceId],
            riskScore[invoiceId],
            creditRating[invoiceId],
            verificationTimestamp[invoiceId]
        );
    }
    
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    function getNonce(address account) external view returns (uint256) {
        return nonces[account];
    }
    
    function getVerificationHash(InvoiceVerification memory verification) external view returns (bytes32) {
        return _hashTypedDataV4(_hashInvoiceVerification(verification));
    }
}

// Interface for core contract callback
interface IEarnXCore {
    function onDocumentVerificationComplete(
        uint256 invoiceId,
        bool isValid,
        uint256 riskScore,
        string memory creditRating
    ) external;
}