import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AuditLog as AuditLogType } from '../types';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const AuditLog: React.FC = () => {
    const { user, auditLogs, users, deleteAuditLog } = useContext(AppContext);

    const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredLogs = useMemo(() => {
        return [...auditLogs]
            .filter(log => {
                const logDate = new Date(log.timestamp);
                const startDate = filters.startDate ? new Date(filters.startDate) : null;
                const endDate = filters.endDate ? new Date(filters.endDate) : null;
                if(endDate) endDate.setHours(23, 59, 59, 999); // Include the whole day

                if (startDate && logDate < startDate) return false;
                if (endDate && logDate > endDate) return false;
                if (filters.userId && log.userId !== filters.userId) return false;
                
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditLogs, filters]);

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    };

    const handleDelete = (logId: string) => {
        setDeletingLogId(logId);
    };

    const executeDelete = async () => {
        if (deletingLogId) {
            await deleteAuditLog(deletingLogId);
            setDeletingLogId(null);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Audit Log</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">User</label>
                        <select name="userId" value={filters.userId} onChange={handleFilterChange} className="mt-1 p-2 w-full border rounded-md">
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Timestamp</th>
                            <th className="p-3 text-sm font-medium text-gray-500">User</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Action</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Entity</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Details</th>
                             {user?.role === 'Admin' && <th className="p-3 text-sm font-medium text-gray-500 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-3 text-sm text-gray-700">{log.username}</td>
                                <td className="p-3 text-sm text-gray-700 font-semibold">{formatAction(log.action)}</td>
                                <td className="p-3 text-sm text-gray-700">{log.entityType} ({log.entityId.substring(0, 8)}...)</td>
                                <td className="p-3 text-sm text-gray-700">
                                    <button onClick={() => setSelectedLog(log)} className="text-blue-500 hover:underline">
                                        View Details
                                    </button>
                                </td>
                                {user?.role === 'Admin' && (
                                    <td className="p-3 text-sm text-center">
                                        <button onClick={() => handleDelete(log.id)} className="text-red-600 hover:text-red-800">
                                            Delete
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredLogs.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No audit logs found matching your criteria.
                    </div>
                )}
            </div>
            
            <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Log Details">
                {selectedLog && (
                    <div className="text-sm">
                        <p><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
                        <p><strong>User:</strong> {selectedLog.username} ({selectedLog.userId})</p>
                        <p><strong>Action:</strong> {selectedLog.action}</p>
                        <p><strong>Entity:</strong> {selectedLog.entityType} ({selectedLog.entityId})</p>
                        <h4 className="font-semibold mt-4 mb-2">Details Snapshot:</h4>
                        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-80">
                            {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                    </div>
                )}
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingLogId}
                onClose={() => setDeletingLogId(null)}
                onConfirm={executeDelete}
                title="Confirm Log Deletion"
                message="Are you sure you want to permanently delete this audit log entry? This action cannot be undone."
            />
        </div>
    );
};

export default AuditLog;