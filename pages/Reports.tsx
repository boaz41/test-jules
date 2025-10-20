import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Sale } from '../types';

const Reports: React.FC = () => {
    const { sales, products, customers, payments, formatCurrency } = useContext(AppContext);
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredSales = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).setHours(23, 59, 59, 999); // Include whole end day
        return sales.filter(sale => {
            const saleDate = new Date(sale.saleDate).getTime();
            return saleDate >= start && saleDate <= end;
        }).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [sales, startDate, endDate]);
    
    const filteredPayments = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).setHours(23, 59, 59, 999); // Include whole end day
        return payments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate).getTime();
            return paymentDate >= start && paymentDate <= end;
        });
    }, [payments, startDate, endDate]);

    const reportData = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
        
        // Correctly calculate total cash received from both standalone payments and sale payments
        const totalFromStandalonePayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalFromSalesPayments = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalPaymentsReceived = totalFromStandalonePayments + totalFromSalesPayments;

        const cogs = filteredSales.reduce((sum, s) => {
            const product = products.find(p => p.id === s.productId);
            return sum + (product ? product.cost * s.quantity : 0);
        }, 0);
        const grossProfit = totalRevenue - cogs;

        const topProductsByValue = [...products].map(p => {
            const productSales = filteredSales.filter(s => s.productId === p.id);
            const totalValue = productSales.reduce((sum, s) => sum + s.totalAmount, 0);
            return { name: p.name, size: p.size, "Total Value": totalValue };
        }).sort((a,b) => b["Total Value"] - a["Total Value"]).slice(0, 5);


        const topCustomersByValue = [...customers].map(c => {
            const customerSales = filteredSales.filter(s => s.customerId === c.id);
            const totalValue = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);
            return { name: c.name, phone: c.phone, "Total Value": totalValue };
        }).sort((a,b) => b["Total Value"] - a["Total Value"]).slice(0, 5);
        
        return { totalRevenue, totalPaymentsReceived, cogs, grossProfit, topProductsByValue, topCustomersByValue };
    }, [filteredSales, filteredPayments, products, customers]);

    const stockReport = useMemo(() => {
        return products.map(p => ({
            name: p.name,
            size: p.size,
            stock: p.stock,
            "Stock Value (Cost)": (p.stock * p.cost),
            status: p.stock <= p.alertLevel ? 'Low Stock' : 'OK'
        })).sort((a, b) => a.stock - b.stock);
    }, [products]);
    
    const exportToCsv = (filename: string, data: any[]) => {
        if (data.length === 0) return;
        
        const header = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(value => 
                `"${String(value).replace(/"/g, '""')}"` // Quote and escape existing quotes
            ).join(',')
        );
        const csvContent = [header, ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExportSalesLog = () => {
        const salesLogData = filteredSales.map(sale => {
            const customer = customers.find(c => c.id === sale.customerId);
            const product = products.find(p => p.id === sale.productId);
            const cost = product ? product.cost * sale.quantity : 0;
            const profit = sale.totalAmount - cost;
            return {
                Date: new Date(sale.saleDate).toLocaleString(),
                'Receipt #': sale.receiptNumber,
                Customer: customer?.name || 'N/A',
                Product: product?.name || 'N/A',
                Quantity: sale.quantity,
                'Unit Price': sale.unitPrice,
                'Total Amount': sale.totalAmount,
                'Amount Paid': sale.amountPaid,
                'Balance Due': sale.balanceDue,
                Profit: profit,
            };
        });
        exportToCsv(`sales-log-${startDate}-to-${endDate}`, salesLogData);
    };

    const handleDownloadReport = () => {
        const reportContent = document.getElementById('reports-page-content')?.innerHTML;
        if (!reportContent) return;

        const printStyles = `
            .no-print { display: none; }
            .print-only { display: block; }
            body { 
                background-color: white !important;
                padding: 2rem;
            }
        `;
        
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Report - ${startDate} to ${endDate}</title>
                ${tailwindScript}
                <style>${printStyles}</style>
            </head>
            <body>
                ${reportContent}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${startDate}-to-${endDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div id="reports-page" className="p-6">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-3xl font-semibold text-gray-800">Reports & Analytics</h1>
                <button onClick={handleDownloadReport} className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
                    Download Report
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="font-medium">Date Range:</div>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md" />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md" />
                 </div>
            </div>

            <div id="reports-page-content">
                <div className="print-only hidden text-2xl font-bold mb-4 text-center">
                    <h1>KIKO JUICE</h1>
                    <h2>Report: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</h2>
                </div>


                {/* Sales Summary */}
                <h2 className="text-xl font-bold text-gray-700 mb-4 mt-8">Sales Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-500">Total Revenue</h3>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(reportData.totalRevenue)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-500">Payments Received</h3>
                        <p className="text-3xl font-bold text-blue-600">{formatCurrency(reportData.totalPaymentsReceived)}</p>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-500">Cost of Goods Sold</h3>
                        <p className="text-3xl font-bold text-gray-700">{formatCurrency(reportData.cogs)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-500">Gross Profit</h3>
                        <p className={`text-3xl font-bold ${reportData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(reportData.grossProfit)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                     {/* Top Products */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-700">Top 5 Selling Products</h2>
                            <button onClick={() => exportToCsv('top-products', reportData.topProductsByValue)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md no-print">Export CSV</button>
                        </div>
                        <table className="w-full">
                            <tbody>{reportData.topProductsByValue.map((p, i) => <tr key={i} className="flex justify-between py-2 border-b"><td>{p.name} {p.size}</td> <td>{formatCurrency(p['Total Value'])}</td></tr>)}</tbody>
                        </table>
                    </div>

                    {/* Top Customers */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-700">Top 5 Customers</h2>
                            <button onClick={() => exportToCsv('top-customers', reportData.topCustomersByValue)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md no-print">Export CSV</button>
                        </div>
                         <table className="w-full">
                            <tbody>{reportData.topCustomersByValue.map((c, i) => <tr key={i} className="flex justify-between py-2 border-b"><td>{c.name}</td> <td>{formatCurrency(c['Total Value'])}</td></tr>)}</tbody>
                        </table>
                    </div>
                </div>

                {/* Detailed Sales Log */}
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto mb-8">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700">Detailed Sales Log</h2>
                        <button onClick={handleExportSalesLog} className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md no-print">Export Sales Log (CSV)</button>
                    </div>
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-50 border-b"><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Product</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Profit</th></tr></thead>
                        <tbody>
                            {filteredSales.map((sale) => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                const product = products.find(p => p.id === sale.productId);
                                const cost = product ? product.cost * sale.quantity : 0;
                                const profit = sale.totalAmount - cost;
                                return (
                                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2 text-sm text-gray-700">{new Date(sale.saleDate).toLocaleDateString()}</td>
                                        <td className="p-2 text-sm text-gray-700">{customer?.name || 'N/A'}</td>
                                        <td className="p-2 text-sm text-gray-700">{product?.name || 'N/A'}</td>
                                        <td className="p-2 text-sm text-gray-700 text-right">{formatCurrency(sale.totalAmount)}</td>
                                        <td className={`p-2 text-sm text-right font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(profit)}</td>
                                    </tr>
                                );
                            })}
                             {filteredSales.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">No sales in selected date range.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                 {/* Stock Report */}
                <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700">Stock Report</h2>
                        <button onClick={() => exportToCsv('stock-report', stockReport)} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md no-print">Export CSV</button>
                    </div>
                    <table className="w-full text-left">
                        <thead><tr className="bg-gray-50 border-b"><th className="p-3">Product</th><th className="p-3 text-right">Stock</th><th className="p-3 text-right">Stock Value (Cost)</th><th className="p-3">Status</th></tr></thead>
                        <tbody>
                            {stockReport.map((p, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{p.name} {p.size}</td>
                                    <td className="p-3 text-right font-semibold">{p.stock}</td>
                                    <td className="p-3 text-right">{formatCurrency(p["Stock Value (Cost)"])}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${p.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;