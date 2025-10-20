import React from 'react';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ isOpen, onClose, title, children }) => {

    if (!isOpen) return null;

    const handleDownload = () => {
        const receiptContent = document.getElementById('printable-receipt');
        const saleReceipt = document.getElementById('sale-receipt-content');
        if (!receiptContent && !saleReceipt) return;
        
        const contentToPrint = saleReceipt || receiptContent;
        if (!contentToPrint) return;

        // We need to include Tailwind styles for the downloaded file to look correct.
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                ${tailwindScript}
            </head>
            <body class="font-mono bg-gray-100 flex justify-center py-10">
                <div class="w-full max-w-sm bg-white shadow-lg p-4">
                    ${contentToPrint.innerHTML}
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s/g, '-')}-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                    </button>
                </div>
                <div className="p-2 overflow-y-auto bg-gray-100 flex-1">
                   <div className="mx-auto" style={{width: '320px'}}>
                       <div id="printable-receipt" className="p-4 bg-white shadow-sm">
                           {children}
                       </div>
                   </div>
                </div>
                <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 mr-2">
                        Close
                    </button>
                    <button onClick={handleDownload} className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                       </svg>
                        Download HTML
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPreviewModal;