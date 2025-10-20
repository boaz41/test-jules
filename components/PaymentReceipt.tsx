import React, { useContext } from 'react';
import { Payment } from '../types';
import { AppContext } from '../context/AppContext';

interface PaymentReceiptProps {
    payment: Payment;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment }) => {
    const { settings, customers, formatCurrency } = useContext(AppContext);
    
    const customer = customers.find(c => c.id === payment.customerId);

    if (!payment || !customer) {
        return <div id="printable-receipt">Loading receipt...</div>;
    }
    
    const balanceAfter = customer.balance;
    const balanceBefore = balanceAfter + payment.amount;

    return (
        <div id="printable-receipt" className="bg-white p-8 font-mono text-sm text-gray-800">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase">{settings.businessName}</h1>
                <p>{settings.businessAddress}</p>
                <p>{settings.businessPhone}</p>
            </div>
            
            <div className="flex justify-between border-y border-dashed py-2 mb-4">
                <div>
                    <p><strong>Payment Date:</strong> {new Date(payment.paymentDate).toLocaleString()}</p>
                     {payment.reference && <p><strong>Reference:</strong> {payment.reference}</p>}
                </div>
                 <div>
                    <p><strong>Paid By:</strong></p>
                    <p>{customer.name}</p>
                    <p>{customer.phone}</p>
                </div>
            </div>

            <h2 className="text-center font-bold text-lg mb-4">PAYMENT RECEIPT</h2>
            
            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b border-dashed">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2">Payment received via {payment.method}</td>
                        <td className="text-right py-2">{formatCurrency(payment.amount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between py-1 border-t border-dashed">
                        <span>Previous Balance</span>
                        <span>{formatCurrency(balanceBefore)}</span>
                    </div>
                     <div className="flex justify-between py-1 font-bold text-base text-green-700">
                        <span>AMOUNT PAID</span>
                        <span>- {formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold bg-gray-100 p-2 mt-1">
                        <span>Remaining Balance</span>
                        <span>{formatCurrency(balanceAfter)}</span>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-8 text-xs">
                <p>Thank you for your payment!</p>
            </div>
        </div>
    );
};

export default PaymentReceipt;