import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dataService } from '../services/dataService';
import { User, Customer, Product, Sale, Payment, ProductionBatch, Settings, LedgerEntry, AuditLog } from '../types';

interface AppContextState {
    user: User | null | undefined;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    changePassword: (newPassword: string) => Promise<boolean>;
    
    users: User[];
    customers: Customer[];
    products: Product[];
    sales: Sale[];
    payments: Payment[];
    productionBatches: ProductionBatch[];
    auditLogs: AuditLog[];
    settings: Settings;

    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    addCustomer: (customer: Omit<Customer, 'id' | 'balance'>) => Promise<void>;
    updateCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    addSale: (sale: Omit<Sale, 'id' | 'receiptNumber' | 'saleDate'>) => Promise<Sale>;
    deleteSale: (id: string) => Promise<void>;
    
    addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => Promise<Payment>;
    updatePayment: (payment: Payment) => Promise<Payment>;
    deletePayment: (id: string) => Promise<void>;

    addProductionBatch: (batch: Omit<ProductionBatch, 'id' | 'batchNumber' | 'productionDate'>) => Promise<void>;
    deleteAuditLog: (id: string) => Promise<void>;
    
    saveSettings: (settings: Settings) => Promise<void>;

    getCustomerLedger: (customerId: string) => Promise<LedgerEntry[]>;
    
    formatCurrency: (amount: number) => string;
    
    printSale: (sale: Sale) => void;
    setPrintSale: React.Dispatch<React.SetStateAction<(sale: Sale) => void>>;
    printPayment: (payment: Payment) => void;
    setPrintPayment: React.Dispatch<React.SetStateAction<(payment: Payment) => void>>;
    
    backupData: () => Promise<object>;
    restoreData: (data: object) => Promise<void>;
    resetData: () => Promise<void>;

    error: string | null;
    clearError: () => void;
    isLoading: boolean;
}

const defaultState: AppContextState = {
    user: undefined,
    login: async () => {},
    logout: () => {},
    changePassword: async () => false,
    users: [],
    customers: [],
    products: [],
    sales: [],
    payments: [],
    productionBatches: [],
    auditLogs: [],
    settings: { businessName: '', businessAddress: '', businessPhone: '', currencySymbol: 'UGX' },
    addUser: async () => {},
    updateUser: async () => {},
    deleteUser: async () => {},
    addCustomer: async () => {},
    updateCustomer: async () => {},
    deleteCustomer: async () => {},
    addProduct: async () => {},
    updateProduct: async () => {},
    deleteProduct: async () => {},
    addSale: async () => ({} as Sale),
    deleteSale: async () => {},
    addPayment: async () => ({} as Payment),
    updatePayment: async () => ({} as Payment),
    deletePayment: async () => {},
    addProductionBatch: async () => {},
    deleteAuditLog: async () => {},
    saveSettings: async () => {},
    getCustomerLedger: async () => [],
    formatCurrency: () => '',
    printSale: () => {},
    setPrintSale: () => {},
    printPayment: () => {},
    setPrintPayment: () => {},
    backupData: async () => ({}),
    restoreData: async () => {},
    resetData: async () => {},
    error: null,
    clearError: () => {},
    isLoading: true,
};

export const AppContext = createContext<AppContextState>(defaultState);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [settings, setSettings] = useState<Settings>(defaultState.settings);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [printSaleHandler, setPrintSale] = useState<(sale: Sale) => void>(() => () => {});
    const [printPaymentHandler, setPrintPayment] = useState<(payment: Payment) => void>(() => () => {});

    const clearLocalData = () => {
        setUsers([]);
        setCustomers([]);
        setProducts([]);
        setSales([]);
        setPayments([]);
        setProductionBatches([]);
        setAuditLogs([]);
        setSettings(defaultState.settings);
    };

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currencySymbol || 'UGX',
            currencyDisplay: 'code'
        }).format(amount).replace('UGX', `${settings.currencySymbol} `);
    }, [settings.currencySymbol]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            await dataService.initializeData();
            const [fetchedUsers, fetchedCustomers, fetchedProducts, fetchedSales, fetchedPayments, fetchedBatches, fetchedSettings, fetchedLogs] = await Promise.all([
                dataService.getUsers(),
                dataService.getCustomers(),
                dataService.getProducts(),
                dataService.getSales(),
                dataService.getPayments(),
                dataService.getProductionBatches(),
                dataService.getSettings(),
                dataService.getAuditLogs()
            ]);
            setUsers(fetchedUsers);
            setCustomers(fetchedCustomers);
            setProducts(fetchedProducts);
            setSales(fetchedSales);
            setPayments(fetchedPayments);
            setProductionBatches(fetchedBatches);
            setSettings(fetchedSettings);
            setAuditLogs(fetchedLogs);
        } catch (err: any) {
            console.error("Failed to fetch data:", err);
            if (err.message && err.message.toLowerCase().includes('permission denied')) {
                setError("Could not load application data. This is likely a Firebase security rule issue. Please ensure your database rules allow authenticated users to read the necessary data.");
            } else {
                setError("Could not load application data. Please check your connection and try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = dataService.onAuthChange((authUser) => {
            setUser(authUser);
            if (authUser) {
                fetchData();
            } else {
                clearLocalData();
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchData]);

    const mutationWithErrorPropagation = async <T,>(fn: () => Promise<T>): Promise<T> => {
        try {
            setError(null);
            return await fn();
        } catch (err: any) {
            console.error("Operation failed:", err);
            setError(err.message || 'An unexpected error occurred.');
            throw err;
        }
    };
    
    const refreshAuditLogs = async () => setAuditLogs(await dataService.getAuditLogs());

    const login = (email: string, password?: string) => mutationWithErrorPropagation(async () => {
        const userProfile = await dataService.authenticateUser(email, password);
        // Note: The onAuthChange listener will handle setting the user and fetching data.
        // We only call this to trigger the authentication flow.
    });
    
    const logout = async () => {
        setUser(null);
        clearLocalData();
        await dataService.logoutUser().catch(err => console.error("Error during sign out:", err));
    };
    
    const changePassword = (newPassword: string) => mutationWithErrorPropagation(async () => {
        const success = await dataService.changePassword(newPassword);
        if (success && user) {
            await dataService.logAction(user, 'PASSWORD_CHANGED', 'User', user.id, { username: user.username });
            await refreshAuditLogs();
        }
        return success;
    });
    
    const addUser = (userData: Omit<User, 'id'>) => mutationWithErrorPropagation(async () => {
        const newUser = await dataService.addUser(userData);
        setUsers(prev => [...prev, newUser]);
        if (user) {
            await dataService.logAction(user, 'USER_CREATED', 'User', newUser.id, { createdUser: newUser.username, role: newUser.role });
            await refreshAuditLogs();
        }
    });
    
    const updateUser = (updatedUserData: User) => mutationWithErrorPropagation(async () => {
        await dataService.updateUser(updatedUserData);
        setUsers(prev => prev.map(u => u.id === updatedUserData.id ? updatedUserData : u));
        if (user) {
            await dataService.logAction(user, 'USER_UPDATED', 'User', updatedUserData.id, { updatedUser: updatedUserData.username, changes: updatedUserData });
            await refreshAuditLogs();
        }
    });

    const deleteUser = (id: string) => mutationWithErrorPropagation(async () => {
        const userToDelete = users.find(u => u.id === id);
        await dataService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        if (user && userToDelete) {
            await dataService.logAction(user, 'USER_DELETED', 'User', id, { deletedUser: userToDelete });
            await refreshAuditLogs();
        }
    });

    const addCustomer = (customerData: Omit<Customer, 'id' | 'balance'>) => mutationWithErrorPropagation(async () => {
        const newCustomer = await dataService.addCustomer(customerData);
        setCustomers(prev => [...prev, newCustomer]);
        if (user) {
            await dataService.logAction(user, 'CUSTOMER_CREATED', 'Customer', newCustomer.id, { newCustomerData: newCustomer });
            await refreshAuditLogs();
        }
    });

    const updateCustomer = (customer: Customer) => mutationWithErrorPropagation(async () => {
        await dataService.updateCustomer(customer);
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        if (user) {
            await dataService.logAction(user, 'CUSTOMER_UPDATED', 'Customer', customer.id, { updatedCustomerData: customer });
            await refreshAuditLogs();
        }
    });

    const deleteCustomer = (id: string) => mutationWithErrorPropagation(async () => {
        const customerToDelete = customers.find(c => c.id === id);
        await dataService.deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
        if (user && customerToDelete) {
            await dataService.logAction(user, 'CUSTOMER_DELETED', 'Customer', id, { deletedCustomer: customerToDelete });
            await refreshAuditLogs();
        }
    });
    
    const addProduct = (product: Omit<Product, 'id'>) => mutationWithErrorPropagation(async () => {
        const newProduct = await dataService.addProduct(product);
        setProducts(prev => [...prev, newProduct]);
         if (user) {
            await dataService.logAction(user, 'PRODUCT_CREATED', 'Product', newProduct.id, { name: newProduct.name, size: newProduct.size });
            await refreshAuditLogs();
        }
    });
    
    const updateProduct = (product: Product) => mutationWithErrorPropagation(async () => {
        await dataService.updateProduct(product);
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        if (user) {
            await dataService.logAction(user, 'PRODUCT_UPDATED', 'Product', product.id, { name: product.name });
            await refreshAuditLogs();
        }
    });

    const deleteProduct = (id: string) => mutationWithErrorPropagation(async () => {
        const productToDelete = products.find(p => p.id === id);
        await dataService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        if (user && productToDelete) {
            await dataService.logAction(user, 'PRODUCT_DELETED', 'Product', id, { deletedProduct: productToDelete });
            await refreshAuditLogs();
        }
    });

    const addSale = (sale: Omit<Sale, 'id' | 'receiptNumber' | 'saleDate'>) => mutationWithErrorPropagation(async () => {
        const newSale = await dataService.addSale(sale);
        setSales(prev => [...prev, newSale]);
        setProducts(await dataService.getProducts());
        const updatedCustomers = await dataService.getCustomers();
        setCustomers(updatedCustomers);
        if (user) {
            const customer = updatedCustomers.find(c => c.id === newSale.customerId);
            const product = products.find(p => p.id === newSale.productId);
            const logDetails = {
                receipt: newSale.receiptNumber,
                product: product ? `${product.name} ${product.size}` : 'N/A',
                quantity: newSale.quantity,
                totalAmount: newSale.totalAmount,
                amountPaid: newSale.amountPaid,
                balanceDue: newSale.balanceDue,
                customer: {
                    id: customer?.id,
                    name: customer?.name,
                    phone: customer?.phone,
                    newBalance: customer?.balance
                }
            };
            await dataService.logAction(user, 'SALE_CREATED', 'Sale', newSale.id, logDetails);
            await refreshAuditLogs();
        }
        return newSale;
    });
    
    const deleteSale = (id: string) => mutationWithErrorPropagation(async () => {
        const saleToDelete = sales.find(s => s.id === id);
        await dataService.deleteSale(id);
        setSales(prev => prev.filter(s => s.id !== id));
        setProducts(await dataService.getProducts());
        const updatedCustomers = await dataService.getCustomers();
        setCustomers(updatedCustomers);
        if (user && saleToDelete) {
            const customer = updatedCustomers.find(c => c.id === saleToDelete.customerId);
            const logDetails = {
                deletedSaleData: saleToDelete,
                customer: {
                    id: customer?.id,
                    name: customer?.name,
                    phone: customer?.phone,
                    balanceAfterReversal: customer?.balance
                }
            };
            await dataService.logAction(user, 'SALE_DELETED', 'Sale', id, logDetails);
            await refreshAuditLogs();
        }
    });

    const addPayment = (payment: Omit<Payment, 'id' | 'paymentDate'>) => mutationWithErrorPropagation(async () => {
        const newPayment = await dataService.addPayment(payment);
        setPayments(prev => [...prev, newPayment]);
        const updatedCustomers = await dataService.getCustomers();
        setCustomers(updatedCustomers);
        if (user) {
            const customer = updatedCustomers.find(c => c.id === newPayment.customerId);
            const logDetails = {
                amount: newPayment.amount,
                method: newPayment.method,
                customer: {
                    id: customer?.id,
                    name: customer?.name,
                    phone: customer?.phone,
                    newBalance: customer?.balance
                }
            };
            await dataService.logAction(user, 'PAYMENT_CREATED', 'Payment', newPayment.id, logDetails);
            await refreshAuditLogs();
        }
        return newPayment;
    });

    const updatePayment = (payment: Payment) => mutationWithErrorPropagation(async () => {
        const oldPayment = payments.find(p => p.id === payment.id);
    
        const updatedPayment = await dataService.updatePayment(payment);
        setPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));
        const updatedCustomers = await dataService.getCustomers();
        setCustomers(updatedCustomers);
        if (user) {
            const customer = updatedCustomers.find(c => c.id === updatedPayment.customerId);
            const logDetails = {
                changeDescription: `Amount changed from ${oldPayment ? formatCurrency(oldPayment.amount) : 'N/A'} to ${formatCurrency(updatedPayment.amount)}`,
                change: {
                    from: oldPayment ? { amount: oldPayment.amount, method: oldPayment.method, reference: oldPayment.reference } : null,
                    to: { amount: updatedPayment.amount, method: updatedPayment.method, reference: updatedPayment.reference }
                },
                customer: {
                    id: customer?.id,
                    name: customer?.name,
                    phone: customer?.phone,
                    newBalance: customer?.balance
                }
            };
            await dataService.logAction(user, 'PAYMENT_UPDATED', 'Payment', payment.id, logDetails);
            await refreshAuditLogs();
        }
        return updatedPayment;
    });
    
    const deletePayment = (id: string) => mutationWithErrorPropagation(async () => {
        const paymentToDelete = payments.find(p => p.id === id);
        await dataService.deletePayment(id);
        setPayments(prev => prev.filter(p => p.id !== id));
        const updatedCustomers = await dataService.getCustomers();
        setCustomers(updatedCustomers);
         if (user && paymentToDelete) {
            const customer = updatedCustomers.find(c => c.id === paymentToDelete.customerId);
            const logDetails = {
                deletedPaymentData: paymentToDelete,
                customer: {
                    id: customer?.id,
                    name: customer?.name,
                    phone: customer?.phone,
                    balanceAfterReversal: customer?.balance
                }
            };
            await dataService.logAction(user, 'PAYMENT_DELETED', 'Payment', id, logDetails);
            await refreshAuditLogs();
        }
    });

    const deleteAuditLog = (id: string) => mutationWithErrorPropagation(async () => {
        // This action itself is not logged to prevent recursion/clutter.
        await dataService.deleteAuditLog(id);
        setAuditLogs(prev => prev.filter(log => log.id !== id));
    });
    
    const addProductionBatch = (batch: Omit<ProductionBatch, 'id' | 'batchNumber' | 'productionDate'>) => mutationWithErrorPropagation(async () => {
        const newBatch = await dataService.addProductionBatch(batch);
        setProductionBatches(prev => [...prev, newBatch]);
        setProducts(await dataService.getProducts());
        if (user) {
            await dataService.logAction(user, 'PRODUCTION_CREATED', 'ProductionBatch', newBatch.id, { batchNumber: newBatch.batchNumber, quantity: newBatch.quantityProduced });
            await refreshAuditLogs();
        }
    });
    
    const saveSettings = (newSettings: Settings) => mutationWithErrorPropagation(async () => {
        await dataService.saveSettings(newSettings);
        setSettings(newSettings);
        if (user) {
            await dataService.logAction(user, 'SETTINGS_UPDATED', 'Settings', 'app-settings', { newSettings });
            await refreshAuditLogs();
        }
    });
    
    const backupData = () => mutationWithErrorPropagation(async () => {
        const data = await dataService.backupData();
        if (user) {
            await dataService.logAction(user, 'DATA_BACKUP', 'System', 'full-backup', {});
            await refreshAuditLogs();
        }
        return data;
    });
    
    const restoreData = (data: object) => mutationWithErrorPropagation(async () => {
        await dataService.restoreData(data);
        if (user) {
            await dataService.logAction(user, 'DATA_RESTORE', 'System', 'full-restore', {});
            await refreshAuditLogs();
        }
        await fetchData();
    });

    const resetData = () => mutationWithErrorPropagation(async () => {
        await dataService.resetData();
        if (user) {
            await dataService.logAction(user, 'DATA_RESET', 'System', 'full-reset', {});
            await refreshAuditLogs();
        }
        await fetchData();
    });

    const value: AppContextState = {
        user,
        login,
        logout,
        changePassword,
        users,
        customers,
        products,
        sales,
        payments,
        productionBatches,
        auditLogs,
        settings,
        addUser,
        updateUser,
        deleteUser,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        deleteSale,
        addPayment,
        updatePayment,
        deletePayment,
        addProductionBatch,
        deleteAuditLog,
        saveSettings,
        getCustomerLedger: dataService.getCustomerLedger,
        formatCurrency,
        printSale: printSaleHandler,
        setPrintSale,
        printPayment: printPaymentHandler,
        setPrintPayment,
        backupData,
        restoreData,
        resetData,
        error,
        clearError: () => setError(null),
        isLoading: user === undefined || isLoading,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};