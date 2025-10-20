import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('buyondoboaz37@gmail.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const { login } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
            // On success, the AppContext's onAuthChange listener will handle
            // setting the user and navigating to the main app view.
        } catch (error: any) {
            console.error("Login page error:", error.code, error.message);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                 setError('Invalid email or password.');
            } else if (error.code === 'auth/configuration-not-found') {
                setError('Firebase configuration error. Please ensure your project settings and API key are correct in firebaseConfig.ts.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-10 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">🥤</h1>
                    <h3 className="text-2xl font-bold">KIKO JUICE</h3>
                    <p className="text-sm text-gray-500">Management System</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="mt-8">
                        <div>
                            <label className="block" htmlFor="email">Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block" htmlFor="password">Password</label>
                            <input
                                type="password"
                                placeholder="Password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        <div className="flex items-baseline justify-between">
                            <button className="w-full px-6 py-3 mt-6 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-300" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                         <div className="mt-6 text-center text-gray-500 text-sm">
                            <p>Enter your credentials to log in.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;