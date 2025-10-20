

import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ProductionBatch, Product } from '../types';
import Modal from '../components/Modal';

const ProductionForm: React.FC<{ onSave: (batchData: Omit<ProductionBatch, 'id' | 'batchNumber' | 'productionDate'>) => Promise<void>; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const { products } = useContext(AppContext);
    const [formData, setFormData] = useState({
        productId: '',
        quantityProduced: 0,
        notes: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantityProduced' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productId || formData.quantityProduced <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }
        setIsSaving(true);
        try {
            const finalData = {
                ...formData,
                quantityProduced: Number(formData.quantityProduced) // Ensure it's a number
            }
            await onSave(finalData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Product*</label>
                    <select name="productId" value={formData.productId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving}>
                        <option value="" disabled>Select Product</option>
                        {products.map((p: Product) => <option key={p.id} value={p.id}>{p.name} {p.size}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Produced*</label>
                    <input type="number" name="quantityProduced" value={formData.quantityProduced} onChange={handleChange} min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving} />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Batch'}
                </button>
            </div>
        </form>
    );
};

const Production: React.FC = () => {
    const { productionBatches, products, addProductionBatch } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleSave = async (batchData: Omit<ProductionBatch, 'id' | 'batchNumber' | 'productionDate'>) => {
        await addProductionBatch(batchData);
        setIsModalOpen(false);
    };

    const sortedBatches = [...productionBatches].sort((a, b) => new Date(b.productionDate).getTime() - new Date(a.productionDate).getTime());

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Production Management</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                    + New Production Batch
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Date</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Batch #</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Product</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Quantity Produced</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBatches.map((batch) => {
                            const product = products.find(p => p.id === batch.productId);
                            return (
                                <tr key={batch.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-sm text-gray-700">{new Date(batch.productionDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-sm text-gray-700">{batch.batchNumber}</td>
                                    <td className="p-3 text-sm text-gray-700">{product ? `${product.name} ${product.size}` : 'N/A'}</td>
                                    <td className="p-3 text-sm text-gray-700 text-right font-semibold">{batch.quantityProduced.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedBatches.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No production batches recorded yet.
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Production Batch">
                <ProductionForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default Production;