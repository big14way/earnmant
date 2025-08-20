import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

export interface IPFSInvoiceData {
  buyer: string;
  amount: string;
  commodity: string;
  supplierCountry: string;
  buyerCountry: string;
  exporterName: string;
  buyerName: string;
  dueDate: number;
  documentHash: string;
  timestamp: number;
  supplier: string;
}

export function generateIPFSHash(invoiceData: IPFSInvoiceData): string {
  const dataString = JSON.stringify(invoiceData, null, 2);
  const hash = keccak256(encodeAbiParameters(parseAbiParameters('string'), [dataString]));
  return `Qm${hash.slice(2, 48)}`;
}

export function generateBlockchainStyleTxHash(invoiceData: IPFSInvoiceData, supplier: string): string {
  const combinedData = `${JSON.stringify(invoiceData)}${supplier}${Date.now()}`;
  const hash = keccak256(encodeAbiParameters(parseAbiParameters('string'), [combinedData]));
  return hash;
}

export function stringToBytes32(str: string): `0x${string}` {
  if (str.length === 0) return '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  const truncated = str.length > 32 ? str.slice(0, 32) : str;
  const padded = truncated.padEnd(32, '\0');
  
  let result = '0x';
  for (let i = 0; i < 32; i++) {
    const char = padded.charCodeAt(i) || 0;
    result += char.toString(16).padStart(2, '0');
  }
  
  return result as `0x${string}`;
}

export function storeInvoiceDataLocally(
  txHash: string, 
  invoiceData: IPFSInvoiceData, 
  ipfsHash: string
): void {
  const storageKey = `ipfs_invoice_${txHash}`;
  const storageData = {
    invoiceData,
    ipfsHash,
    txHash,
    storedAt: Date.now(),
    method: 'ipfs_hybrid'
  };
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(storageData));
    
    const existingInvoices = JSON.parse(localStorage.getItem('all_ipfs_invoices') || '[]');
    existingInvoices.push({
      txHash,
      ipfsHash,
      timestamp: storageData.storedAt,
      amount: invoiceData.amount,
      buyer: invoiceData.buyer,
      supplier: invoiceData.supplier
    });
    localStorage.setItem('all_ipfs_invoices', JSON.stringify(existingInvoices));
  } catch (error) {
    console.error('Failed to store invoice data locally:', error);
  }
}

export function getStoredInvoiceData(txHash: string): any | null {
  try {
    const storageKey = `ipfs_invoice_${txHash}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve invoice data:', error);
    return null;
  }
}

export function getAllStoredInvoices(): any[] {
  try {
    return JSON.parse(localStorage.getItem('all_ipfs_invoices') || '[]');
  } catch (error) {
    console.error('Failed to retrieve stored invoices:', error);
    return [];
  }
}