import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Modal from './Modal';

interface AirtelMessageModalProps {
    customer: Customer | null;
    onClose: () => void;
}

const AirtelMessageModal: React.FC<AirtelMessageModalProps> = ({ customer, onClose }) => {
    const [message, setMessage] = useState('');
    const [isSent, setIsSent] = useState(false);
    const maxChars = 160;

    useEffect(() => {
        if (customer) {
            setMessage('');
            setIsSent(false);
        }
    }, [customer]);


    if (!customer) return null;

    const handleSend = () => {
        if (message.trim() === '') {
            return;
        }
        console.log(`Simulating SMS send to ${customer.name} (${customer.phone}): "${message}"`);
        setIsSent(true);
        setTimeout(() => {
            handleClose();
        }, 2000); // Close modal after 2 seconds
    };

    const handleClose = () => {
        setMessage('');
        setIsSent(false);
        onClose();
    };

    return (
        <Modal isOpen={!!customer} onClose={handleClose} title={`Send SMS to ${customer.name}`}>
            <div className="bg-gray-200 p-4 rounded-lg flex justify-center">
                <div className="w-full max-w-sm bg-black rounded-3xl border-4 border-gray-800 shadow-xl overflow-hidden">
                    <div className="p-2 bg-white flex flex-col h-[350px]">
                        <div className="flex justify-between items-center px-2 py-1 border-b flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-800">KIKO JUICE</div>
                            <div className="text-xs text-gray-500">To: {customer.phone}</div>
                        </div>

                        {isSent ? (
                            <div className="flex-grow flex items-center justify-center">
                                <p className="text-lg text-green-600 font-semibold">Message Sent!</p>
                            </div>
                        ) : (
                            <>
                                <div className="py-2 flex-grow">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        maxLength={maxChars}
                                        className="w-full h-full p-2 text-sm border-none focus:ring-0 resize-none bg-white"
                                    />
                                </div>
                                <div className="flex justify-between items-center px-2 py-2 border-t flex-shrink-0">
                                    <div className="text-xs text-gray-500">
                                        {message.length} / {maxChars}
                                    </div>
                                    <button
                                        onClick={handleSend}
                                        className="bg-blue-500 text-white font-semibold px-4 py-1 rounded-full text-sm hover:bg-blue-600 transition"
                                    >
                                        Send
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AirtelMessageModal;
