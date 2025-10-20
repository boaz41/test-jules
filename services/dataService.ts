import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    getAuth,
    type User as FirebaseUser
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { firebaseService } from './firebaseService';
import { firestoreService } from './dbService';
import { auth, app as mainApp, firebaseConfig } from '../firebaseConfig'; // Import the initialized auth instance and config
import {
    User, Customer, Product, Sale, Payment, ProductionBatch, Settings, LedgerEntry, Page, AuditLog
} from '../types';


// Helper function to remove password before saving user profile
const cleanUserData = (user: Omit<User, 'id'>) => {
    const { password, ...userData } = user;
    return userData;
};


export const dataService = {
    // Initialization
    async initializeData() {
        try {
            // These checks will fail if the user is not logged in due to security rules.
            // We catch the error and proceed, assuming data exists. Seeding is a one-time operation.
            const customersExist = await firebaseService.pathExists('customers');
            if (!customersExist) {
                console.log("Firebase appears empty, seeding initial data (excluding users)...");
                const defaultSettings: Settings = {
                    businessName: 'KIKO JUICE',
                    businessAddress: '123 Juice Lane, Kampala',
                    businessPhone: '+256 777 123456',
                    currencySymbol: 'UGX',
                };
                await firebaseService.set('settings', defaultSettings);
                // In a real app, initial data seeding for products/customers would go here.
                console.log("Seeding complete. Remember to create an initial admin user in the Firebase Authentication console.");
            }
        } catch (error) {
            // This error is expected on first load for unauthenticated users.
            // The app will proceed assuming the database is already seeded.
            console.warn("Permission denied checking for initial data. This is normal if not logged in. Skipping seed check.");
        }
    },

    // Auth
    onAuthChange(callback: (user: User | null) => void) {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                let userProfile = await firestoreService.getDoc<Omit<User, 'id' | 'permissions'> & { permissions?: User['permissions'] }>(`users`, firebaseUser.uid);

                if (!userProfile) {
                    // Profile doesn't exist, create a default one based on email.
                    console.log(`User profile for ${firebaseUser.email} not found. Creating a default profile.`);
                    
                    const isAdminEmail = firebaseUser.email === 'buyondoboaz37@gmail.com';
                    const defaultRole = isAdminEmail ? 'Admin' : 'Cashier';
                    const defaultPermissions: { [key in Page]?: boolean } = {};
                    const allPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger', 'production', 'reports', 'users', 'settings', 'backup', 'audit-log'];
                    
                    if (isAdminEmail) {
                        // Grant all permissions to the admin
                        allPages.forEach(p => defaultPermissions[p] = true);
                    } else {
                        // Grant limited permissions for Cashier
                        const cashierPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger'];
                        allPages.forEach(p => defaultPermissions[p] = cashierPages.includes(p));
                    }

                    const newUserProfileData: Omit<User, 'id'> = {
                        username: firebaseUser.email?.split('@')[0] || 'new_user',
                        email: firebaseUser.email!,
                        role: defaultRole,
                        permissions: defaultPermissions
                    };

                    await firestoreService.setDoc(`users`, firebaseUser.uid, newUserProfileData);
                    callback({ ...newUserProfileData, id: firebaseUser.uid });

                } else {
                    // Profile exists, proceed with existing logic (permission migration if needed)
                    const { id, ...profileData } = userProfile;
                    let finalProfile: Omit<User, 'id'>;
                    
                    if (!profileData.permissions) {
                        console.log(`User ${profileData.email} missing permissions object. Migrating based on role: ${profileData.role}`);
                        const defaultPermissions: { [key in Page]?: boolean } = {};
                        const allPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger', 'production', 'reports', 'users', 'settings', 'backup', 'audit-log'];
                        
                        switch (profileData.role) {
                            case 'Admin':
                                allPages.forEach(p => defaultPermissions[p] = true);
                                break;
                            case 'Manager':
                                allPages.forEach(p => defaultPermissions[p] = p !== 'users' && p !== 'audit-log');
                                break;
                            case 'Cashier':
                                const cashierPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger'];
                                allPages.forEach(p => defaultPermissions[p] = cashierPages.includes(p));
                                break;
                        }
                        finalProfile = { ...profileData, permissions: defaultPermissions };
                        // Save migrated profile back to Firestore DB
                        await firestoreService.setDoc(`users`, firebaseUser.uid, finalProfile);
                    } else {
                        finalProfile = profileData as Omit<User, 'id'>;
                    }
                    callback({ ...finalProfile, id: firebaseUser.uid });
                }
            } else {
                callback(null);
            }
        });
    },

    async authenticateUser(email: string, password?: string): Promise<User> {
        if (!password) throw new Error("Password is required.");

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
    
        // After successful auth, immediately fetch or create the user profile from Firestore.
        // This makes the login process atomic and prevents race conditions.
        let userProfile = await firestoreService.getDoc<Omit<User, 'id' | 'permissions'> & { permissions?: User['permissions'] }>(`users`, firebaseUser.uid);
    
        if (userProfile) {
             const { id, ...profileData } = userProfile;
             // Check for and run permission migration if necessary for older user profiles.
             if (!profileData.permissions) {
                 console.log(`User ${profileData.email} missing permissions object. Migrating based on role: ${profileData.role}`);
                 const defaultPermissions: { [key in Page]?: boolean } = {};
                 const allPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger', 'production', 'reports', 'users', 'settings', 'backup', 'audit-log'];
                 
                 switch (profileData.role) {
                     case 'Admin':
                         allPages.forEach(p => defaultPermissions[p] = true);
                         break;
                     case 'Manager':
                         allPages.forEach(p => defaultPermissions[p] = p !== 'users' && p !== 'audit-log');
                         break;
                     case 'Cashier':
                         const cashierPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger'];
                         allPages.forEach(p => defaultPermissions[p] = cashierPages.includes(p));
                         break;
                 }
                 const finalProfile = { ...profileData, permissions: defaultPermissions };
                 await firestoreService.setDoc(`users`, firebaseUser.uid, finalProfile);
                 return { ...finalProfile, id: firebaseUser.uid };
             }
             return { ...(profileData as Omit<User, 'id'>), id: firebaseUser.uid };

        } else {
            // Profile doesn't exist, create a default one based on email.
            console.log(`User profile for ${firebaseUser.email} not found. Creating a default profile.`);
            
            const isAdminEmail = firebaseUser.email === 'buyondoboaz37@gmail.com';
            const defaultRole = isAdminEmail ? 'Admin' : 'Cashier';
            const defaultPermissions: { [key in Page]?: boolean } = {};
            const allPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger', 'production', 'reports', 'users', 'settings', 'backup', 'audit-log'];
            
            if (isAdminEmail) {
                allPages.forEach(p => defaultPermissions[p] = true);
            } else {
                const cashierPages: Page[] = ['dashboard', 'customers', 'new-sale', 'products', 'transactions', 'ledger'];
                allPages.forEach(p => defaultPermissions[p] = cashierPages.includes(p));
            }

            const newUserProfileData: Omit<User, 'id'> = {
                username: firebaseUser.email?.split('@')[0] || 'new_user',
                email: firebaseUser.email!,
                role: defaultRole,
                permissions: defaultPermissions
            };

            await firestoreService.setDoc(`users`, firebaseUser.uid, newUserProfileData);
            return { ...newUserProfileData, id: firebaseUser.uid };
        }
    },

    logoutUser() {
        return signOut(auth);
    },

    async changePassword(newPassword: string): Promise<boolean> {
        const user = auth.currentUser;
        if (user) {
            try {
                await updatePassword(user, newPassword);
                return true;
            } catch (error) {
                console.error("Failed to update password:", error);
                return false;
            }
        }
        return false;
    },

    // Users (Now using Firestore)
    getUsers: () => firestoreService.getAll<User>('users'),
    async addUser(user: Omit<User, 'id'>): Promise<User> {
        if (!user.password) {
            throw new Error("Password is required to create a new user.");
        }

        const tempAppName = `temp-user-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        let uid: string;

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, user.email, user.password);
            uid = userCredential.user.uid;
        } catch (error) {
            await deleteApp(tempApp);
            console.error("Error creating user in Firebase Auth:", error);
            throw error;
        }

        await deleteApp(tempApp);

        try {
            // Save user profile to Firestore
            const profileData = cleanUserData(user);
            await firestoreService.setDoc('users', uid, profileData);
            return { ...profileData, id: uid };
        } catch (dbError) {
            console.error(`CRITICAL: Auth user ${uid} was created, but saving profile to Firestore failed.`, dbError);
            throw new Error("User was created but their profile could not be saved. Please contact an administrator.");
        }
    },
    updateUser: (updatedUser: User) => {
        const { id, ...profile } = updatedUser;
        // Update user profile in Firestore
        return firestoreService.setDoc('users', id, cleanUserData(profile));
    },
    deleteUser: (userId: string) => {
        console.warn(`Client-side app cannot delete Firebase Auth user. Deleting user ${userId} from Firestore only.`);
        // Delete user profile from Firestore
        return firestoreService.deleteDoc('users', userId);
    },

    // Customers (Remains on Realtime DB)
    getCustomers: () => firebaseService.getAll<Customer>('customers'),
    addCustomer: async (customerData: Omit<Customer, 'id' | 'balance'>): Promise<Customer> => {
        const newCustomerData = { ...customerData, balance: 0 };
        const newId = await firebaseService.add('customers', newCustomerData);
        return { ...newCustomerData, id: newId };
    },
    updateCustomer: (updatedCustomer: Customer) => {
        const { id, ...data } = updatedCustomer;
        return firebaseService.set(`customers/${id}`, data);
    },
    deleteCustomer: (customerId: string) => firebaseService.remove(`customers/${customerId}`),
    updateCustomerBalance: async (customerId: string, amountChange: number) => {
        const customer = await firebaseService.get<Customer>(`customers/${customerId}`);
        if (customer) {
            const newBalance = (customer.balance || 0) + amountChange;
            await firebaseService.updateField(`customers/${customerId}`, 'balance', newBalance);
        }
    },

    // Products (Remains on Realtime DB)
    getProducts: () => firebaseService.getAll<Product>('products'),
    addProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
        const newId = await firebaseService.add('products', productData);
        return { ...productData, id: newId };
    },
    updateProduct: (updatedProduct: Product) => {
        const { id, ...data } = updatedProduct;
        return firebaseService.set(`products/${id}`, data);
    },
    deleteProduct: (productId: string) => firebaseService.remove(`products/${productId}`),
    updateStock: async (productId: string, quantityChange: number) => {
        const product = await firebaseService.get<Product>(`products/${productId}`);
        if (product) {
            const newStock = (product.stock || 0) + quantityChange;
            await firebaseService.updateField(`products/${productId}`, 'stock', newStock);
        }
    },

    // Sales (Remains on Realtime DB)
    getSales: () => firebaseService.getAll<Sale>('sales'),
    async addSale(saleData: Omit<Sale, 'id' | 'receiptNumber' | 'saleDate'>): Promise<Sale> {
        const saleDate = new Date().toISOString();
        const salesCount = (await dataService.getSales()).length;
        const receiptNumber = `RCPT-${(salesCount + 1).toString().padStart(4, '0')}`;

        const newSaleData = {
            ...saleData,
            saleDate,
            receiptNumber
        };

        const newSaleId = await firebaseService.add('sales', newSaleData);
        await dataService.updateCustomerBalance(saleData.customerId, saleData.balanceDue);
        await dataService.updateStock(saleData.productId, -saleData.quantity);
        return { ...newSaleData, id: newSaleId };
    },
    async deleteSale(saleId: string): Promise<void> {
        const sale = await firebaseService.get<Sale>(`sales/${saleId}`);
        if (sale) {
            await dataService.updateCustomerBalance(sale.customerId, -sale.balanceDue);
            await dataService.updateStock(sale.productId, sale.quantity);
            await firebaseService.remove(`sales/${saleId}`);
        }
    },

    // Payments (Remains on Realtime DB)
    getPayments: () => firebaseService.getAll<Payment>('payments'),
    async addPayment(paymentData: Omit<Payment, 'id' | 'paymentDate'>): Promise<Payment> {
        const paymentDate = new Date().toISOString();
        const newPaymentData = { ...paymentData, paymentDate };
        const newPaymentId = await firebaseService.add('payments', newPaymentData);
        await dataService.updateCustomerBalance(paymentData.customerId, -paymentData.amount);
        return { ...newPaymentData, id: newPaymentId };
    },
    async updatePayment(updatedPayment: Payment): Promise<Payment> {
        const oldPayment = await firebaseService.get<Payment>(`payments/${updatedPayment.id}`);
        if (!oldPayment) throw new Error("Original payment not found for update.");

        const amountDifference = oldPayment.amount - updatedPayment.amount;
        
        await dataService.updateCustomerBalance(updatedPayment.customerId, amountDifference);
        
        const { id, ...data } = updatedPayment;
        await firebaseService.set(`payments/${id}`, data);
        return updatedPayment;
    },
    async deletePayment(paymentId: string): Promise<void> {
        const payment = await firebaseService.get<Payment>(`payments/${paymentId}`);
        if (payment) {
            await dataService.updateCustomerBalance(payment.customerId, payment.amount);
        }
        await firebaseService.remove(`payments/${paymentId}`);
    },

    // Ledger (Remains on Realtime DB)
    async getCustomerLedger(customerId: string): Promise<LedgerEntry[]> {
        const customer = await firebaseService.get<Customer>(`customers/${customerId}`);
        if (!customer) return [];
    
        const sales = (await dataService.getSales()).filter(s => s.customerId === customerId);
        const payments = (await dataService.getPayments()).filter(p => p.customerId === customerId);
    
        const transactions: ({ date: string, type: 'SALE'; data: Sale } | { date: string, type: 'PAYMENT'; data: Payment })[] = [
            ...sales.map(s => ({ date: s.saleDate, type: 'SALE' as const, data: s })),
            ...payments.map(p => ({ date: p.paymentDate, type: 'PAYMENT' as const, data: p }))
        ];
    
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
        const customerBalance = customer.balance || 0;
    
        const openingBalance = transactions.reduce((balance, transaction) => {
            if (transaction.type === 'SALE') {
                return balance - (transaction.data.balanceDue || 0);
            } else { // PAYMENT
                return balance + (transaction.data.amount || 0);
            }
        }, customerBalance);
    
        let runningBalance = openingBalance;
        const ledger: LedgerEntry[] = [{
            date: transactions.length > 0 ? new Date(new Date(transactions[0].date).getTime() - 1).toISOString() : new Date().toISOString(),
            type: 'BALANCE',
            description: 'Opening Balance',
            debit: 0,
            credit: 0,
            balance: runningBalance,
        }];
    
        for (const transaction of transactions) {
            if (transaction.type === 'SALE') {
                const sale = transaction.data;
                const totalAmount = sale.totalAmount || 0;
                const amountPaid = sale.amountPaid || 0;
                
                runningBalance += totalAmount;
                ledger.push({
                    date: sale.saleDate,
                    type: 'SALE',
                    description: `Sale #${sale.receiptNumber}`,
                    debit: totalAmount,
                    credit: 0,
                    balance: runningBalance,
                });
    
                if (amountPaid > 0) {
                    runningBalance -= amountPaid;
                    ledger.push({
                        date: sale.saleDate,
                        type: 'PAYMENT',
                        description: `Payment for Sale #${sale.receiptNumber} (${sale.paymentMethod})`,
                        debit: 0,
                        credit: amountPaid,
                        balance: runningBalance,
                    });
                }
            } else { // Standalone PAYMENT
                const payment = transaction.data;
                const amount = payment.amount || 0;
                runningBalance -= amount;
                ledger.push({
                    date: payment.paymentDate,
                    type: 'PAYMENT',
                    description: `Payment via ${payment.method} ${payment.reference ? `(${payment.reference})` : ''}`,
                    debit: 0,
                    credit: amount,
                    balance: runningBalance,
                });
            }
        }
    
        return ledger.reverse(); // Show most recent first
    },
    
    // Production (Remains on Realtime DB)
    async getProductionBatches(): Promise<ProductionBatch[]> {
        return firebaseService.getAll<ProductionBatch>('productionBatches');
    },
    async addProductionBatch(batch: Omit<ProductionBatch, 'id' | 'batchNumber' | 'productionDate'>): Promise<ProductionBatch> {
        const batches = await this.getProductionBatches();
        const batchNumber = `PROD-${(batches.length + 1).toString().padStart(4, '0')}`;
        const newBatch = { ...batch, productionDate: new Date().toISOString(), batchNumber };
        const newId = await firebaseService.add('productionBatches', newBatch);
        await this.updateStock(batch.productId, batch.quantityProduced);
        return { ...newBatch, id: newId };
    },

    // Settings (Remains on Realtime DB)
    getSettings: () => firebaseService.get<Settings>('settings').then(s => s || { businessName: '', businessAddress: '', businessPhone: '', currencySymbol: '' }),
    saveSettings: (settings: Settings) => firebaseService.set('settings', settings),

    // Audit Log (New - on Realtime DB)
    getAuditLogs: () => firebaseService.getAll<AuditLog>('auditLogs'),
    deleteAuditLog: (logId: string) => firebaseService.remove(`auditLogs/${logId}`),
    async logAction(
        user: User,
        action: string,
        entityType: string,
        entityId: string,
        details: any
    ): Promise<void> {
        const logEntry: Omit<AuditLog, 'id'> = {
            timestamp: new Date().toISOString(),
            userId: user.id,
            username: user.username,
            action,
            entityType,
            entityId,
            details,
        };
        await firebaseService.add('auditLogs', logEntry);
    },
    
    // Data Management (Remains on Realtime DB)
    backupData: async (): Promise<object> => {
        const data = await firebaseService.get('');
        return data || {};
    },
    restoreData: (data: object) => firebaseService.set('', data),
    resetData: async () => {
        await firebaseService.remove('');
        await dataService.initializeData();
    }
};