

import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Customer } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import AirtelMessageModal from '../components/AirtelMessageModal';
import PaymentModal from '../components/PaymentModal';

const CustomerForm: React.FC<{ customer?: Customer; onSave: (customerData: Omit<Customer, 'id' | 'balance'> | Customer) => Promise<void>; onCancel: () => void }> = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        customerType: customer?.customerType || 'Retail',
        creditLimit: customer?.creditLimit || 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const isNewCustomer = !customer;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'creditLimit' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isNewCustomer) {
                await onSave(formData as Omit<Customer, 'id' | 'balance'>);
            } else {
                await onSave({ ...customer!, ...formData });
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name*</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone*</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                    <select name="customerType" value={formData.customerType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving}>
                        <option>Retail</option>
                        <option>Wholesale</option>
                        <option>Distributor</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                    <input type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving} />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                    {isSaving ? 'Saving...' : (isNewCustomer ? 'Add Customer' : 'Save Changes')}
                </button>
            </div>
        </form>
    );
};

const Customers: React.FC = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, formatCurrency } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
    const [messagingCustomer, setMessagingCustomer] = useState<Customer | null>(null);
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [customers, searchTerm]);

    const handleAdd = () => {
        setEditingCustomer(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingCustomerId(id);
    };

    const executeDelete = async () => {
        if (deletingCustomerId) {
            await deleteCustomer(deletingCustomerId);
            setDeletingCustomerId(null);
        }
    };

    const handleSave = async (customerData: Omit<Customer, 'id' | 'balance'> | Customer) => {
        if ('id' in customerData) {
            await updateCustomer(customerData);
        } else {
            await addCustomer(customerData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Customers</h1>
                <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                    + Add New Customer
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
                />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Name</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Phone</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Type</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Balance</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700">{customer.name}</td>
                                <td className="p-3 text-sm text-gray-700">{customer.phone}</td>
                                <td className="p-3 text-sm text-gray-700">{customer.customerType}</td>
                                <td className={`p-3 text-sm text-right font-semibold ${customer.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                    {formatCurrency(customer.balance)}
                                </td>
                                <td className="p-3 text-sm text-center">
                                    <div className="flex items-center justify-center space-x-3">
                                        {customer.balance > 0 && (
                                             <button onClick={() => setPayingCustomer(customer)} className="text-emerald-600 hover:text-emerald-800 font-semibold">Pay</button>
                                        )}
                                        <button onClick={() => setMessagingCustomer(customer)} className="text-cyan-600 hover:text-cyan-800">SMS</button>
                                        <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-800">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No customers found.
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}>
                <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingCustomerId}
                onClose={() => setDeletingCustomerId(null)}
                onConfirm={executeDelete}
                title="Confirm Customer Deletion"
                message="Are you sure you want to delete this customer? This action is not reversible."
            />

            <AirtelMessageModal 
                customer={messagingCustomer}
                onClose={() => setMessagingCustomer(null)}
            />
            
            {payingCustomer && (
                <PaymentModal
                    isOpen={!!payingCustomer}
                    onClose={() => setPayingCustomer(null)}
                    customerToPay={payingCustomer}
                />
            )}
        </div>
    );
};

export default Customers;