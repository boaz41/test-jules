import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Modal from './Modal';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { changePassword } = useContext(AppContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        const success = await changePassword(newPassword);
        if (success) {
            setIsSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } else {
            setError('Failed to change password. Please try again.');
        }
    };
    
    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsSuccess(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
            {isSuccess ? (
                <div className="text-center">
                    <p className="text-lg text-green-600 font-semibold">Password changed successfully!</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">Update Password</button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default ChangePasswordModal;
