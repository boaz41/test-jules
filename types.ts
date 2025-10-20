// types.ts

export interface User {
    id: string;
    username: string; // For display purposes
    email: string;    // For authentication
    role: 'Admin' | 'Manager' | 'Cashier';
    permissions: { [key in Page]?: boolean };
    // Password is for UI purposes, not for secure storage.
    password?: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    customerType: 'Retail' | 'Wholesale' | 'Distributor';
    creditLimit: number;
    balance: number;
}

export interface Product {
    id: string;
    name: string;
    size: string;
    price: number;
    cost: number;
    stock: number;
    alertLevel: number;
    description?: string;
}

export interface Sale {
    id: string;
    receiptNumber: string;
    customerId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    paymentMethod: 'Cash' | 'Credit' | 'Mobile Money' | 'Bank Transfer' | 'Partial Payment';
    saleDate: string;
}

export interface Payment {
    id: string;
    customerId: string;
    amount: number;
    method: 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque';
    paymentDate: string;
    reference?: string;
}

export interface ProductionBatch {
    id: string;
    batchNumber: string;
    productId: string;
    quantityProduced: number;
    productionDate: string;
    notes?: string;
}

export interface Settings {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    currencySymbol: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: string; // e.g., 'USER_CREATED', 'SALE_DELETED'
    entityType: string; // e.g., 'User', 'Sale'
    entityId: string;
    details: any; // A snapshot of the data
}


export type Page = 'dashboard' | 'customers' | 'new-sale' | 'products' | 'transactions' | 'ledger' | 'production' | 'reports' | 'users' | 'settings' | 'backup' | 'audit-log';

export interface LedgerEntry {
    date: string;
    type: 'SALE' | 'PAYMENT' | 'BALANCE';
    description: string;
    debit: number;
    credit: number;
    balance: number;
}