import React, { useContext } from 'react';
import { Sale } from '../types';
import { AppContext } from '../context/AppContext';

interface ReceiptProps {
    sale: Sale;
}

const Receipt: React.FC<ReceiptProps> = ({ sale }) => {
    const { settings, customers, products, formatCurrency } = useContext(AppContext);
    
    const customer = customers.find(c => c.id === sale.customerId);
    const product = products.find(p => p.id === sale.productId);

    if (!sale || !customer || !product) {
        return <div id="printable-receipt">Loading receipt...</div>;
    }
    
    return (
        <div id="sale-receipt-content" className="bg-white p-4 font-mono text-sm text-gray-800">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase">{settings.businessName}</h1>
                <p>{settings.businessAddress}</p>
                <p>{settings.businessPhone}</p>
            </div>
            
            <div className="flex justify-between border-y border-dashed py-2 mb-4 text-xs">
                <div>
                    <p><strong>Receipt #:</strong> {sale.receiptNumber}</p>
                    <p><strong>Date:</strong> {new Date(sale.saleDate).toLocaleString()}</p>
                </div>
                 <div>
                    <p><strong>Billed To:</strong></p>
                    <p>{customer.name}</p>
                    <p>{customer.phone}</p>
                </div>
            </div>

            <h2 className="text-center font-bold text-lg mb-2">SALES RECEIPT</h2>
            
            <table className="w-full mb-4">
                <thead>
                    <tr className="border-b border-dashed">
                        <th className="text-left py-2 font-semibold">Item</th>
                        <th className="text-center py-2 font-semibold">Qty</th>
                        <th className="text-right py-2 font-semibold">Price</th>
                        <th className="text-right py-2 font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2 break-words">{product.name} {product.size}</td>
                        <td className="text-center py-2">{sale.quantity}</td>
                        <td className="text-right py-2 whitespace-nowrap">{formatCurrency(sale.unitPrice)}</td>
                        <td className="text-right py-2 whitespace-nowrap">{formatCurrency(sale.totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mt-4">
                 <table className="w-full max-w-[250px] text-sm">
                    <tbody>
                        <tr className="border-t border-dashed">
                            <td className="py-1 font-semibold">Subtotal</td>
                            <td className="py-1 text-right whitespace-nowrap">{formatCurrency(sale.totalAmount)}</td>
                        </tr>
                        <tr className="font-bold text-base">
                            <td className="py-1 font-semibold">TOTAL</td>
                            <td className="py-1 text-right whitespace-nowrap">{formatCurrency(sale.totalAmount)}</td>
                        </tr>
                        <tr className="border-t border-dashed mt-2">
                            <td className="pt-2 font-semibold">Amount Paid</td>
                            <td className="pt-2 text-right whitespace-nowrap">{formatCurrency(sale.amountPaid)}</td>
                        </tr>
                        <tr className="font-bold">
                           <td colSpan={2} className="pt-1">
                               <div className="bg-gray-100 p-2 rounded flex justify-between">
                                  <span>Balance Due</span>
                                  <span className="whitespace-nowrap">{formatCurrency(sale.balanceDue)}</span>
                               </div>
                           </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div className="text-center mt-8 text-xs">
                <p>Thank you for your business!</p>
                <p>Payment Method: {sale.paymentMethod}</p>
            </div>
        </div>
    );
};

export default Receipt;