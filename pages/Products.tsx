

import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Product } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { generateProductDescription } from '../services/geminiService';

const ProductForm: React.FC<{ product?: Product; onSave: (productData: Omit<Product, 'id'> | Product) => Promise<void>; onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        size: product?.size || '',
        price: product?.price || 0,
        cost: product?.cost || 0,
        stock: product?.stock || 0,
        alertLevel: product?.alertLevel || 10,
        description: product?.description || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const isNewProduct = !product;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['price', 'cost', 'stock', 'alertLevel'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) : value }));
    };

    const handleGenerateDescription = async () => {
        if (!formData.name || !formData.size) {
            alert("Please enter a product name and size first.");
            return;
        }
        setIsGeneratingDesc(true);
        try {
            const description = await generateProductDescription(formData.name, formData.size);
            setFormData(prev => ({ ...prev, description }));
        } finally {
            setIsGeneratingDesc(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                cost: Number(formData.cost),
                stock: Number(formData.stock),
                alertLevel: Number(formData.alertLevel)
            };
            if (isNewProduct) {
                await onSave(payload);
            } else {
                await onSave({ ...product!, ...payload });
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
                    <label className="block text-sm font-medium text-gray-700">Size*</label>
                    <input type="text" name="size" value={formData.size} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g., 500ml, 1 Litre" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price (Selling)*</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cost (Production)*</label>
                    <input type="number" name="cost" value={formData.cost} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Initial Stock*</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving || !isNewProduct} readOnly={!isNewProduct} />
                    {!isNewProduct && <p className="text-xs text-gray-500 mt-1">Stock is updated via Sales & Production.</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Low Stock Alert Level*</label>
                    <input type="number" name="alertLevel" value={formData.alertLevel} onChange={handleChange} min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving} />
                    <button type="button" onClick={handleGenerateDescription} className="mt-2 text-sm text-emerald-600 hover:text-emerald-800 disabled:text-gray-400" disabled={isGeneratingDesc || isSaving}>
                        {isGeneratingDesc ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                    {isSaving ? 'Saving...' : (isNewProduct ? 'Add Product' : 'Save Changes')}
                </button>
            </div>
        </form>
    );
};


const Products: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, formatCurrency } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTerm]);

    const handleAdd = () => {
        setEditingProduct(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingProductId(id);
    };

    const executeDelete = async () => {
        if (deletingProductId) {
            await deleteProduct(deletingProductId);
            setDeletingProductId(null);
        }
    };

    const handleSave = async (productData: Omit<Product, 'id'> | Product) => {
        if ('id' in productData) {
            await updateProduct(productData);
        } else {
            await addProduct(productData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Products</h1>
                <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                    + Add New Product
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <input
                    type="text"
                    placeholder="Search by name..."
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
                            <th className="p-3 text-sm font-medium text-gray-500">Size</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Price</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Cost</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Stock</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Status</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-semibold">{product.name}</td>
                                <td className="p-3 text-sm text-gray-700">{product.size}</td>
                                <td className="p-3 text-sm text-gray-700 text-right">{formatCurrency(product.price)}</td>
                                <td className="p-3 text-sm text-gray-700 text-right">{formatCurrency(product.cost)}</td>
                                <td className="p-3 text-sm text-gray-700 text-right font-bold">{product.stock}</td>
                                <td className="p-3 text-sm">
                                    {product.stock <= product.alertLevel ? (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Low Stock</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                                    )}
                                </td>
                                <td className="p-3 text-sm text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No products found.
                    </div>
                )}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
                <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingProductId}
                onClose={() => setDeletingProductId(null)}
                onConfirm={executeDelete}
                title="Confirm Product Deletion"
                message="Are you sure you want to delete this product? This action cannot be undone."
            />
        </div>
    );
};

export default Products;