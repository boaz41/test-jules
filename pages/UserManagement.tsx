import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Page } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { NAVIGATION_ITEMS } from '../constants';

const UserForm: React.FC<{
    currentUser: User | null;
    user?: User;
    onSave: (userData: Omit<User, 'id'> | User) => Promise<void>;
    onCancel: () => void
}> = ({ currentUser, user, onSave, onCancel }) => {
    const isNewUser = !user;
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        role: user?.role || 'Cashier',
        password: '',
        confirmPassword: '',
    });
    
    // Initialize permissions state. For a new user, all permissions are off by default.
    const [permissions, setPermissions] = useState(() => {
        if (user?.permissions) {
            return user.permissions;
        }
        const defaultPerms: { [key in Page]?: boolean } = {};
        NAVIGATION_ITEMS.forEach(item => defaultPerms[item.page] = false);
        return defaultPerms;
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    const isEditingSelfAsAdmin = user?.id === currentUser?.id && user?.role === 'Admin';


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (page: Page, isChecked: boolean) => {
        setPermissions(prev => ({ ...prev, [page]: isChecked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isNewUser) {
            if (!formData.password) {
                setError('Password is required for new users.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
             if (formData.password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
        }
        
        setError('');
        setIsSaving(true);
        try {
            const { confirmPassword, ...payload } = formData;
            const finalPayload = {
                ...payload,
                permissions: formData.role === 'Admin' ? // If role is Admin, force all permissions to true
                    NAVIGATION_ITEMS.reduce((acc, item) => ({ ...acc, [item.page]: true }), {})
                    : permissions,
            };

            if (isNewUser) {
                await onSave(finalPayload as Omit<User, 'id'>);
            } else {
                const updatePayload = { ...user!, ...finalPayload };
                if (!updatePayload.password) {
                    delete (updatePayload as any).password;
                }
                await onSave(updatePayload);
            }
        } catch(err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    // When role changes to Admin, set all permissions to true and disable checkboxes
    useEffect(() => {
        if (formData.role === 'Admin') {
            const allPermissions = NAVIGATION_ITEMS.reduce((acc, item) => ({...acc, [item.page]: true}), {});
            setPermissions(allPermissions);
        }
    }, [formData.role]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username*</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email*</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={isSaving || !isNewUser} readOnly={!isNewUser} />
                    {!isNewUser && <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={isSaving || isEditingSelfAsAdmin}>
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Cashier</option>
                    </select>
                     {isEditingSelfAsAdmin && <p className="text-xs text-gray-500 mt-1">Admin role cannot be changed for self.</p>}
                </div>
                <div className="md:col-span-2"><hr className="my-2"/></div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{isNewUser ? 'Password*' : 'New Password (optional)'}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required={isNewUser} disabled={isSaving} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{isNewUser ? 'Confirm Password*' : 'Confirm New Password'}</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required={isNewUser} disabled={isSaving} />
                </div>
                {error && <p className="md:col-span-2 text-sm text-red-500">{error}</p>}

                 <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Permissions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {NAVIGATION_ITEMS.map(item => (
                            <label key={item.page} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={permissions[item.page] || false}
                                    onChange={(e) => handlePermissionChange(item.page, e.target.checked)}
                                    disabled={isSaving || formData.role === 'Admin' || isEditingSelfAsAdmin}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </div>
                     {formData.role === 'Admin' && <p className="text-xs text-blue-600 mt-2">Admins automatically have all permissions.</p>}
                     {isEditingSelfAsAdmin && <p className="text-xs text-blue-600 mt-2">Cannot edit own permissions as an Admin.</p>}
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300" disabled={isSaving}>Cancel</button>
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                    {isSaving ? 'Saving...' : (isNewUser ? 'Add User' : 'Save Changes')}
                </button>
            </div>
        </form>
    );
};

const UserManagement: React.FC = () => {
    const { user: currentUser, users, addUser, updateUser, deleteUser } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const handleAdd = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeletingUserId(id);
    };

    const executeDelete = async () => {
        if (deletingUserId) {
            await deleteUser(deletingUserId);
            setDeletingUserId(null);
        }
    };
    
    const handleSave = async (userData: Omit<User, 'id'> | User) => {
        // This function now throws an error on failure, which will be caught in UserForm's handleSubmit
        if ('id' in userData) {
            await updateUser(userData);
        } else {
            await addUser(userData);
        }
        // This line will only be reached on success
        setIsModalOpen(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">User Management</h1>
                <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition">
                    + Add New User
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Username</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Email</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Role</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700">{user.username}</td>
                                <td className="p-3 text-sm text-gray-700">{user.email}</td>
                                <td className="p-3 text-sm text-gray-700">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700">Edit</button>
                                        <button 
                                            onClick={() => handleDelete(user.id)} 
                                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                            disabled={user.id === currentUser?.id}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
                <UserForm 
                    currentUser={currentUser}
                    user={editingUser} 
                    onSave={handleSave} 
                    onCancel={() => setIsModalOpen(false)} 
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingUserId}
                onClose={() => setDeletingUserId(null)}
                onConfirm={executeDelete}
                title="Confirm User Deletion"
                message="Are you sure you want to delete this user? This will only remove them from the application database, not Firebase Auth. This action cannot be undone."
            />
        </div>
    );
};

export default UserManagement;