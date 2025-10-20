

import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale, Payment } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentModal from '../components/PaymentModal';

const Transactions: React.FC = () => {
    const { 
        sales, 
        payments, 
        customers, 
        products, 
        deleteSale, 
        deletePayment, 
        formatCurrency, 
        printSale,
        printPayment
    } = useContext(AppContext);

    const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales');
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
    const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const sortedSales = useMemo(() => {
        return [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [sales]);

    const sortedPayments = useMemo(() => {
        return [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [payments]);
    
    const filteredSales = useMemo(() => {
        if (!searchTerm) return sortedSales;
        return sortedSales.filter(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const product = products.find(p => p.id === sale.productId);
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                sale.receiptNumber.toLowerCase().includes(lowerSearchTerm) ||
                customer?.name.toLowerCase().includes(lowerSearchTerm) ||
                product?.name.toLowerCase().includes(lowerSearchTerm)
            );
        });
    }, [sortedSales, searchTerm, customers, products]);

    const filteredPayments = useMemo(() => {
        if (!searchTerm) return sortedPayments;
        return sortedPayments.filter(payment => {
            const customer = customers.find(c => c.id === payment.customerId);
            return customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [sortedPayments, searchTerm, customers]);


    const executeDeleteSale = async () => {
        if (deletingSaleId) {
            await deleteSale(deletingSaleId);
            setDeletingSaleId(null);
        }
    };
    
    const executeDeletePayment = async () => {
        if (deletingPaymentId) {
            await deletePayment(deletingPaymentId);
            setDeletingPaymentId(null);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Transactions Log</h1>

            <div className="flex border-b mb-6">
                <button onClick={() => { setActiveTab('sales'); setSearchTerm(''); }} className={`px-4 py-2 text-lg font-medium ${activeTab === 'sales' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
                    Sales ({sales.length})
                </button>
                <button onClick={() => { setActiveTab('payments'); setSearchTerm(''); }} className={`px-4 py-2 text-lg font-medium ${activeTab === 'payments' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
                    Payments ({payments.length})
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <input
                    type="text"
                    placeholder={activeTab === 'sales' ? "Search by Receipt #, Customer, or Product..." : "Search by Customer..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
                />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                {activeTab === 'sales' ? (
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-50 border-b"><th className="p-3">Date</th><th className="p-3">Receipt #</th><th className="p-3">Customer</th><th className="p-3">Product</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3 text-center">Actions</th></tr></thead>
                        <tbody>
                            {filteredSales.map((sale) => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                const product = products.find(p => p.id === sale.productId);
                                const status = sale.balanceDue > 0 ? (sale.amountPaid > 0 ? 'Partial' : 'Credit') : 'Paid';
                                return (
                                <tr key={sale.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm">{new Date(sale.saleDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm font-semibold">{sale.receiptNumber}</td>
                                    <td className="p-3 text-sm">{customer?.name || 'N/A'}</td>
                                    <td className="p-3 text-sm">{product ? `${product.name} ${product.size}` : 'N/A'}</td>
                                    <td className="p-3 text-sm text-right">{formatCurrency(sale.totalAmount)}</td>
                                    <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status === 'Paid' ? 'bg-green-100 text-green-800' : status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{status}</span></td>
                                    <td className="p-3 text-sm text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => printSale(sale)} className="text-gray-500 hover:text-gray-700">Print</button>
                                            <button onClick={() => setDeletingSaleId(sale.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                        </div>
                                    </td>
                                </tr>);
                            })}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-50 border-b"><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3 text-right">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3 text-center">Actions</th></tr></thead>
                        <tbody>
                             {filteredPayments.map((payment) => {
                                const customer = customers.find(c => c.id === payment.customerId);
                                return (
                                <tr key={payment.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm">{customer?.name || 'N/A'}</td>
                                    <td className="p-3 text-sm text-right font-semibold">{formatCurrency(payment.amount)}</td>
                                    <td className="p-3 text-sm">{payment.method}</td>
                                    <td className="p-3 text-sm">{payment.reference || '-'}</td>
                                    <td className="p-3 text-sm text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                             <button onClick={() => printPayment(payment)} className="text-gray-500 hover:text-gray-700">Print</button>
                                             <button onClick={() => setEditingPayment(payment)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                            <button onClick={() => setDeletingPaymentId(payment.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                        </div>
                                    </td>
                                </tr>);
                            })}
                        </tbody>
                    </table>
                )}
                {(activeTab === 'sales' && filteredSales.length === 0) && <div className="text-center py-10 text-gray-500">No sales found.</div>}
                {(activeTab === 'payments' && filteredPayments.length === 0) && <div className="text-center py-10 text-gray-500">No payments found.</div>}
            </div>
            
            <ConfirmationModal
                isOpen={!!deletingSaleId}
                onClose={() => setDeletingSaleId(null)}
                onConfirm={executeDeleteSale}
                title="Confirm Sale Deletion"
                message="Are you sure you want to delete this sale? This will revert stock levels and customer balance. This action cannot be undone."
            />
            
            <ConfirmationModal
                isOpen={!!deletingPaymentId}
                onClose={() => setDeletingPaymentId(null)}
                onConfirm={executeDeletePayment}
                title="Confirm Payment Deletion"
                message="Are you sure you want to delete this payment? This will revert the customer's balance. This action cannot be undone."
            />

            {editingPayment && (
                <PaymentModal
                    isOpen={!!editingPayment}
                    onClose={() => setEditingPayment(null)}
                    paymentToEdit={editingPayment}
                />
            )}
        </div>
    );
};

export default Transactions;