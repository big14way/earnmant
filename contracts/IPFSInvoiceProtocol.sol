// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPFSInvoiceProtocol
 * @dev Gas-optimized invoice contract using IPFS hash storage
 */
contract IPFSInvoiceProtocol {
    struct Invoice {
        uint256 id;
        address supplier;
        address buyer;
        uint256 amount;
        uint256 dueDate;
        bytes32 ipfsHash; // Store IPFS hash as bytes32 (gas efficient)
        bool verified;
        uint256 createdAt;
    }
    
    uint256 public invoiceCounter;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public supplierInvoices;
    
    event InvoiceSubmitted(
        uint256 indexed invoiceId,
        address indexed supplier,
        address indexed buyer,
        uint256 amount,
        bytes32 ipfsHash
    );
    
    constructor() {
        invoiceCounter = 0;
    }
    
    /**
     * @dev Submit a new invoice with IPFS hash (gas optimized)
     */
    function submitInvoice(
        address buyer,
        uint256 amount,
        uint256 dueDate,
        bytes32 ipfsHash
    ) external returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(amount > 0, "Amount must be greater than 0");
        require(dueDate > block.timestamp, "Due date must be in the future");
        require(ipfsHash != bytes32(0), "IPFS hash required");
        
        invoiceCounter++;
        uint256 invoiceId = invoiceCounter;
        
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            supplier: msg.sender,
            buyer: buyer,
            amount: amount,
            dueDate: dueDate,
            ipfsHash: ipfsHash,
            verified: true, // Auto-verify for simplicity
            createdAt: block.timestamp
        });
        
        supplierInvoices[msg.sender].push(invoiceId);
        
        emit InvoiceSubmitted(invoiceId, msg.sender, buyer, amount, ipfsHash);
        
        return invoiceId;
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoiceId > 0 && invoiceId <= invoiceCounter, "Invalid invoice ID");
        return invoices[invoiceId];
    }
    
    /**
     * @dev Get total number of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return invoiceCounter;
    }
    
    /**
     * @dev Get supplier's invoices
     */
    function getSupplierInvoices(address supplier) external view returns (uint256[] memory) {
        return supplierInvoices[supplier];
    }
    
    /**
     * @dev Convert string to bytes32 (helper function for IPFS hash)
     */
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        
        assembly {
            result := mload(add(source, 32))
        }
    }
}