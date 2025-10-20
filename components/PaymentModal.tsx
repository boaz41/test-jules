import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer, Payment } from '../types';
import Modal from './Modal';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerToPay?: Customer;
    paymentToEdit?: Payment;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, customerToPay, paymentToEdit }) => {
    const { customers, addPayment, updatePayment, printPayment } = useContext(AppContext);

    const [formData, setFormData] = useState({
        customerId: '',
        amount: 0,
        method: 'Cash' as 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque',
        reference: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (paymentToEdit) {
            setFormData({
                customerId: paymentToEdit.customerId,
                amount: paymentToEdit.amount,
                method: paymentToEdit.method,
                reference: paymentToEdit.reference || '',
            });
        } else if (customerToPay) {
            setFormData({
                customerId: customerToPay.id,
                amount: customerToPay.balance > 0 ? customerToPay.balance : 0,
                method: 'Cash',
                reference: '',
            });
        } else {
            // Reset form for a new general payment
            setFormData({
                customerId: '',
                amount: 0,
                method: 'Cash',
                reference: '',
            });
        }
    }, [paymentToEdit, customerToPay, isOpen]); // Rerun effect when modal is opened

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerId || formData.amount <= 0) {
            alert('Please select a customer and enter a valid amount.');
            return;
        }
        setIsSaving(true);
        try {
            if (paymentToEdit) {
                const updatedPayment = await updatePayment({ ...paymentToEdit, ...formData });
                if (updatedPayment) {
                    alert('Payment updated successfully!');
                    // Optionally print updated payment receipt
                    // printPayment(updatedPayment);
                }
            } else {
                const newPayment = await addPayment(formData);
                 if (newPayment) {
                    alert('Payment recorded successfully!');
                    printPayment(newPayment);
                }
            }
            handleClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        // Reset local state if needed before calling parent onClose
        setFormData({ customerId: '', amount: 0, method: 'Cash', reference: '' });
        setIsSaving(false);
        onClose();
    };
    
    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={paymentToEdit ? 'Edit Payment' : 'Record Payment'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer*</label>
                        <select
                            name="customerId"
                            value={formData.customerId}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                            disabled={isSaving || !!customerToPay || !!paymentToEdit}
                        >
                            <option value="" disabled>Select a customer</option>
                            {customers.map((c: Customer) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {selectedCustomer && (
                            <p className="text-sm text-gray-500 mt-1">
                                Current Balance: <span className={selectedCustomer.balance > 0 ? 'text-red-600 font-semibold' : ''}>{selectedCustomer.balance.toLocaleString()}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount*</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            min="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            disabled={isSaving}
                        >
                            <option>Cash</option>
                            <option>Mobile Money</option>
                            <option>Bank Transfer</option>
                            <option>Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                        <input
                            type="text"
                            name="reference"
                            value={formData.reference}
                            onChange={handleChange}
                            placeholder="e.g., Cheque No., Transaction ID"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            disabled={isSaving}
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>
                        Cancel
                    </button>
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (paymentToEdit ? 'Update Payment' : 'Record Payment')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentModal;
