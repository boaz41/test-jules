

import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings as SettingsType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const Settings: React.FC = () => {
    const { user, settings, saveSettings, backupData, restoreData, resetData } = useContext(AppContext);
    const [formData, setFormData] = useState<SettingsType>({
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        currencySymbol: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [confirmation, setConfirmation] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveSettings(formData);
        setIsSaving(false);
    };

    const handleBackup = () => {
        setConfirmation({
            isOpen: true,
            title: 'Confirm Backup',
            message: 'Are you sure you want to download a backup of all application data?',
            onConfirm: async () => {
                const data = await backupData();
                const dataStr = JSON.stringify(data, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `kiko-juice-backup-${new Date().toISOString()}.json`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                setConfirmation(null);
            }
        });
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setConfirmation({
                    isOpen: true,
                    title: 'Confirm Restore',
                    message: 'Are you sure you want to restore data from this file? This will OVERWRITE all current data.',
                    onConfirm: async () => {
                        await restoreData(data);
                        setConfirmation(null);
                        alert("Data restored successfully! The application will now reload.");
                        window.location.reload();
                    }
                });
            } catch (error) {
                console.error("Failed to restore data:", error);
                alert("Failed to parse or restore data. Please check the file format.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    };

    const handleReset = () => {
        setConfirmation({
            isOpen: true,
            title: 'DANGER: Confirm Data Reset',
            message: 'Are you absolutely sure you want to reset all data? This will delete everything and cannot be undone.',
            onConfirm: async () => {
                await resetData();
                setConfirmation(null);
                alert("Application data has been reset.");
                window.location.reload();
            }
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Settings</h1>
            
            <div className={`grid grid-cols-1 ${user?.role === 'Admin' ? 'lg:grid-cols-2' : ''} gap-8`}>
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Business Information</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Address</label>
                                <input type="text" name="businessAddress" value={formData.businessAddress} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Phone</label>
                                <input type="text" name="businessPhone" value={formData.businessPhone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
                                <input type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
                
                {user?.role === 'Admin' && (
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Data Management</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">Backup Data</h3>
                                    <p className="text-sm text-gray-500">Download all application data to a JSON file.</p>
                                </div>
                                <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                    Backup
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">Restore Data</h3>
                                    <p className="text-sm text-gray-500">Restore from a backup file. Overwrites current data.</p>
                                </div>
                                <button onClick={handleRestoreClick} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
                                    Restore
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                            </div>
                             <div className="flex justify-between items-center border-t pt-4 mt-4 border-red-300">
                                <div>
                                    <h3 className="font-semibold text-red-700">Reset Application</h3>
                                    <p className="text-sm text-gray-500">Delete all data. This is irreversible.</p>
                                </div>
                                <button onClick={handleReset} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {confirmation?.isOpen && (
                <ConfirmationModal
                    isOpen={confirmation.isOpen}
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}
        </div>
    );
};

export default Settings;