import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        Confirm Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
