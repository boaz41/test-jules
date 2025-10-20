import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import DashboardCard from '../components/DashboardCard';
import { Sale } from '../types';

const Dashboard: React.FC = () => {
    const { sales, customers, products, payments, formatCurrency } = useContext(AppContext);

    const metrics = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        
        const todaySales = sales.filter(s => s.saleDate && s.saleDate.startsWith(today));
        const todayPayments = payments.filter(p => p.paymentDate && p.paymentDate.startsWith(today));
        
        const totalRevenueToday = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
        
        const paymentsFromSalesToday = todaySales.reduce((acc, s) => acc + (s.amountPaid || 0), 0);
        const standalonePaymentsAmountToday = todayPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const cashReceivedToday = paymentsFromSalesToday + standalonePaymentsAmountToday;

        const totalDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
        const lowStockCount = products.filter(p => (p.stock || 0) <= (p.alertLevel || 0)).length;

        return {
            todaySales: formatCurrency(totalRevenueToday),
            cashReceivedToday: formatCurrency(cashReceivedToday),
            outstandingDebt: formatCurrency(totalDebt),
            lowStockItems: lowStockCount,
        };
    }, [sales, customers, products, payments, formatCurrency]);
    
    const recentSales = useMemo(() => {
        return [...sales]
            .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
            .slice(0, 5);
    }, [sales]);

    return (
        <div className="p-6 bg-[#556B2F] rounded-lg">
            <h1 className="text-4xl font-bold text-white mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Today's Sales (Revenue)" value={metrics.todaySales} icon="💵" color="border-green-500" />
                <DashboardCard title="Cash Received Today" value={metrics.cashReceivedToday} icon="💰" color="border-blue-500" />
                <DashboardCard title="Outstanding Debt" value={metrics.outstandingDebt} icon="⚠️" color="border-red-500" />
                <DashboardCard title="Low Stock Items" value={metrics.lowStockItems} icon="📦" color="border-yellow-500" />
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sales</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3 text-sm font-medium text-gray-600">Date</th>
                                <th className="p-3 text-sm font-medium text-gray-600">Customer</th>
                                <th className="p-3 text-sm font-medium text-gray-600">Product</th>
                                <th className="p-3 text-sm font-medium text-gray-600 text-right">Amount</th>
                                <th className="p-3 text-sm font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.map((sale: Sale) => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                const product = products.find(p => p.id === sale.productId);
                                const status = sale.balanceDue > 0 ? (sale.amountPaid > 0 ? 'Partial' : 'Credit') : 'Paid';

                                return (
                                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm text-gray-800">{new Date(sale.saleDate).toLocaleDateString()}</td>
                                        <td className="p-3 text-sm text-gray-800">{customer?.name || 'N/A'}</td>
                                        <td className="p-3 text-sm text-gray-800">{product ? `${product.name} ${product.size}` : 'N/A'}</td>
                                        <td className="p-3 text-sm text-gray-800 text-right">{formatCurrency(sale.totalAmount)}</td>
                                        <td className="p-3 text-sm">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;