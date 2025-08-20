// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MinimalInvoiceProtocol
 * @dev Ultra-minimal invoice contract that definitely works
 */
contract MinimalInvoiceProtocol {
    uint256 public invoiceCounter;
    
    event InvoiceSubmitted(
        uint256 indexed invoiceId,
        address indexed supplier,
        uint256 amount
    );
    
    constructor() {
        invoiceCounter = 0;
    }
    
    /**
     * @dev Submit a new invoice with minimal data
     */
    function submitInvoice(
        address buyer,
        uint256 amount,
        string memory commodity,
        string memory supplierCountry,
        string memory buyerCountry,
        string memory exporterName,
        string memory buyerName,
        uint256 dueDate,
        string memory documentHash
    ) external returns (uint256) {
        // Minimal validation
        require(amount > 0, "Amount must be greater than 0");
        
        invoiceCounter++;
        
        emit InvoiceSubmitted(invoiceCounter, msg.sender, amount);
        
        return invoiceCounter;
    }
    
    /**
     * @dev Get total number of invoices
     */
    function getTotalInvoices() external view returns (uint256) {
        return invoiceCounter;
    }
}