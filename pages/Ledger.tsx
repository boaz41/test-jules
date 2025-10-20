import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer, LedgerEntry } from '../types';
import PaymentModal from '../components/PaymentModal';

const Ledger: React.FC = () => {
    const { customers, getCustomerLedger, formatCurrency } = useContext(AppContext);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedCustomerId) {
            setIsLoading(true);
            const fetchLedger = async () => {
                try {
                    const entries = await getCustomerLedger(selectedCustomerId);
                    setLedgerEntries(entries);
                } catch (error) {
                    console.error("Failed to fetch customer ledger:", error);
                    setLedgerEntries([]); // Clear entries on error to avoid showing stale data
                } finally {
                    setIsLoading(false);
                }
            };
            fetchLedger();
        } else {
            setLedgerEntries([]);
        }
    }, [selectedCustomerId, getCustomerLedger, customers]); // Add customers to dependency array to refresh ledger on data change

    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);
    
    const getRowClass = (entry: LedgerEntry) => {
        const baseClass = 'border-b hover:bg-gray-50';
        if (entry.type === 'BALANCE') {
            return `${baseClass} bg-gray-100 font-semibold`;
        }
        if (entry.type === 'PAYMENT') {
            return `${baseClass} bg-green-50`;
        }
        if (entry.type === 'SALE' && entry.credit > 0) {
            return `${baseClass} bg-yellow-50`; // Highlight sales with immediate payment
        }
        return baseClass;
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Customer Ledger</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                 <select
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="mt-1 block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm p-2"
                 >
                    <option value="" disabled>Select a customer</option>
                    {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                {selectedCustomer && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-blue-800">Current Balance: {formatCurrency(selectedCustomer.balance)}</h3>
                        {selectedCustomer.balance > 0 && (
                             <button onClick={() => setIsPaymentModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                                Record Payment
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Date</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Type</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Description</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Debit</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Credit</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                             <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading ledger...</td></tr>
                        ) : ledgerEntries.length > 0 ? (
                            ledgerEntries.map((entry, index) => (
                                <tr key={index} className={getRowClass(entry)}>
                                    <td className="p-3 text-sm text-gray-700">{entry.type !== 'BALANCE' ? new Date(entry.date).toLocaleString() : ''}</td>
                                    <td className={`p-3 text-sm font-semibold ${entry.type === 'BALANCE' ? 'text-gray-500' : 'text-gray-700'}`}>{entry.type}</td>
                                    <td className="p-3 text-sm text-gray-700">{entry.description}</td>
                                    <td className="p-3 text-sm text-red-600 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                    <td className="p-3 text-sm text-green-600 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                    <td className="p-3 text-sm text-gray-800 font-bold text-right">{formatCurrency(entry.balance)}</td>
                                </tr>
                            ))
                        ) : (
                            selectedCustomerId && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No transactions found for this customer.</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {selectedCustomer && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    customerToPay={selectedCustomer}
                />
            )}
        </div>
    );
};

export default Ledger;