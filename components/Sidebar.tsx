import React, { useContext } from 'react';
import { Page } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { AppContext } from '../context/AppContext';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const { user, logout } = useContext(AppContext);

    const handleNavigation = (page: Page) => {
        setCurrentPage(page);
    };

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col no-print">
            <div className="flex items-center justify-center h-20 border-b border-gray-700 flex-shrink-0">
                <h1 className="text-2xl font-bold">🥤 KIKO JUICE</h1>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {NAVIGATION_ITEMS.map((item) => {
                    // Admins see everything. Other users see pages based on their specific permissions.
                    const canAccess = user && (user.role === 'Admin' || user.permissions?.[item.page]);
                    
                    if (canAccess) {
                         return (
                            <button
                                key={item.page}
                                onClick={() => handleNavigation(item.page)}
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                    currentPage === item.page
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span className="ml-3">{item.label}</span>
                            </button>
                        );
                    }
                    return null;
                })}
            </nav>
            <div className="px-2 py-4 border-t border-gray-700 flex-shrink-0">
                <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <LogoutIcon />
                    <span className="ml-3">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;