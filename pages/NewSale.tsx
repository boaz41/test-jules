import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer, Page, Product, Sale } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

interface NewSaleProps {
    setCurrentPage: (page: Page) => void;
}

const NewSale: React.FC<NewSaleProps> = ({ setCurrentPage }) => {
    const { customers, products, addSale, formatCurrency, printSale } = useContext(AppContext);
    
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit' | 'Mobile Money' | 'Bank Transfer' | 'Partial Payment'>('Cash');
    const [amountPaid, setAmountPaid] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showStockWarning, setShowStockWarning] = useState(false);

    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
    const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId]);
    
    const totalAmount = useMemo(() => quantity * unitPrice, [quantity, unitPrice]);
    const balanceDue = useMemo(() => totalAmount - amountPaid, [totalAmount, amountPaid]);

    useEffect(() => {
        if (selectedProduct) {
            setUnitPrice(selectedProduct.price);
        } else {
            setUnitPrice(0);
        }
    }, [selectedProduct]);
    
    useEffect(() => {
        if (paymentMethod === 'Cash' || paymentMethod === 'Mobile Money' || paymentMethod === 'Bank Transfer') {
            setAmountPaid(totalAmount);
        } else if (paymentMethod === 'Credit') {
            setAmountPaid(0);
        }
    }, [paymentMethod, totalAmount]);

    const executeSale = async () => {
        if (!selectedCustomerId || !selectedProductId || quantity <= 0) {
            alert('Please fill all required fields.');
            return;
        }
        setIsLoading(true);
        try {
            const newSale = await addSale({
                customerId: selectedCustomerId,
                productId: selectedProductId,
                quantity,
                unitPrice,
                totalAmount,
                amountPaid,
                balanceDue,
                paymentMethod
            });

            if (newSale) {
                printSale(newSale); // Show receipt preview
                setCurrentPage('transactions'); // Navigate to see the new sale in the log
            }
        } catch (error) {
            console.error("Failed to record sale:", error);
        } finally {
            setIsLoading(false);
            setShowStockWarning(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(selectedProduct && selectedProduct.stock < quantity) {
            setShowStockWarning(true);
        } else {
            await executeSale();
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">New Sale</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Customer*</label>
                    <select
                        value={selectedCustomerId || ''}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    >
                        <option value="" disabled>Select a customer</option>
                        {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Product*</label>
                    <select
                        value={selectedProductId || ''}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                    >
                        <option value="" disabled>Select a product</option>
                        {products.map((p: Product) => <option key={p.id} value={p.id}>{`${p.name} ${p.size} (Stock: ${p.stock})`}</option>)}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity*</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                    <input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                </div>

                <div className="md:col-span-2 mt-4 p-4 border-t">
                    <h3 className="text-xl font-bold text-gray-800 text-right">Total: {formatCurrency(totalAmount)}</h3>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option>Cash</option>
                        <option>Credit</option>
                        <option>Mobile Money</option>
                        <option>Bank Transfer</option>
                        <option>Partial Payment</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                    <input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} min="0" max={totalAmount} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                
                <div className="md:col-span-2 p-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 text-right">Balance Due: {formatCurrency(balanceDue)}</h3>
                </div>
                
                <div className="md:col-span-2 flex justify-end">
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 font-semibold text-lg disabled:bg-emerald-300" disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Record Sale'}
                    </button>
                </div>
            </form>
            
            <ConfirmationModal
                isOpen={showStockWarning}
                onClose={() => setShowStockWarning(false)}
                onConfirm={executeSale}
                title="Low Stock Warning"
                message={`There are only ${selectedProduct?.stock} units of ${selectedProduct?.name} in stock. Do you want to proceed with the sale anyway?`}
            />

        </div>
    );
};

export default NewSale;