import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ChangePasswordModal from './ChangePasswordModal';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const Header: React.FC = () => {
    const { user, logout } = useContext(AppContext);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
    };
    
    const handleChangePassword = () => {
        setIsDropdownOpen(false);
        setIsModalOpen(true);
    };

    return (
        <>
            <header className="flex items-center justify-end bg-white shadow-md p-4 h-16 flex-shrink-0 no-print space-x-4">
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="font-semibold text-gray-800 text-sm">{user?.username || 'Unknown User'}</p>
                            <p className="text-xs text-gray-500">{user?.role || 'No Role'}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                            <button
                                onClick={handleChangePassword}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Change Password
                            </button>
                        </div>
                    )}
                </div>
                
                <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-700"
                >
                    <LogoutIcon />
                    <span className="ml-2">Logout</span>
                </button>

            </header>
            <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default Header;