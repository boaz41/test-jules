

import React, { useState, useContext, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import LoginPage from './pages/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import NewSale from './pages/NewSale';
import Transactions from './pages/Transactions';
import Ledger from './pages/Ledger';
import UserManagement from './pages/UserManagement';
import Production from './pages/Production';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Receipt from './components/Receipt';
import PaymentReceipt from './components/PaymentReceipt';
import ReceiptPreviewModal from './components/ReceiptPreviewModal';
import { Page, Sale, Payment } from './types';


// This component contains the actual UI and consumes the context.
// It will be wrapped by the AppProvider in the main export.
const AppUI: React.FC = () => {
    const { user, setPrintSale, setPrintPayment, error, clearError } = useContext(AppContext);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [printingSale, setPrintingSale] = useState<Sale | null>(null);
    const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);

    // Handlers that will be passed to the context
    const printSaleHandler = (sale: Sale) => setPrintingSale(sale);
    const printPaymentHandler = (payment: Payment) => setPrintingPayment(payment);

    // Register the print handlers with the context
    useEffect(() => {
        if (setPrintSale) {
            setPrintSale(() => printSaleHandler);
        }
    }, [setPrintSale]);

    useEffect(() => {
        if (setPrintPayment) {
            setPrintPayment(() => printPaymentHandler);
        }
    }, [setPrintPayment]);

    if (user === undefined) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">🥤</h1>
                    <h3 className="text-2xl font-bold">KIKO JUICE</h3>
                    <p className="text-lg text-gray-500 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }
    
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'customers': return <Customers />;
            case 'new-sale': return <NewSale setCurrentPage={setCurrentPage} />;
            case 'products': return <Products />;
            case 'transactions': return <Transactions />;
            case 'ledger': return <Ledger />;
            case 'users': return <UserManagement />;
            case 'production': return <Production />;
            case 'reports': return <Reports />;
            case 'audit-log': return <AuditLog />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };
    
    const mainContent = (
        <div id="main-app-content" className="flex h-screen bg-gray-100 font-sans">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative m-6" role="alert">
                                <div className="flex">
                                    <div className="py-1">
                                        <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold">An error occurred</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                    <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );

    return (
        <>
            {mainContent}
            <ReceiptPreviewModal
                isOpen={!!printingSale || !!printingPayment}
                onClose={() => {
                    setPrintingSale(null);
                    setPrintingPayment(null);
                }}
                title={printingSale ? "Sale Receipt Preview" : "Payment Receipt Preview"}
            >
                {printingSale && <Receipt sale={printingSale} />}
                {printingPayment && <PaymentReceipt payment={printingPayment} />}
            </ReceiptPreviewModal>
        </>
    );
};

// The main export wraps the UI component with the provider.
const AppContent: React.FC = () => {
    return (
        <AppProvider>
            <AppUI />
        </AppProvider>
    );
}

export default AppContent;