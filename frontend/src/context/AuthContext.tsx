import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { url } from 'inspector';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface DecodedToken {
    exp?: number;
    id?: string;
    email?: string;
    role?: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to get initial auth state synchronously
const getInitialAuthState = (): { user: User | null; isLoading: boolean } => {
    try {
        // Check URL for token first
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const urlRole = urlParams.get('role');
        const urlName = urlParams.get('name');

        if (urlToken) {
            localStorage.setItem('token', urlToken);
            if (urlRole) {
                localStorage.setItem('role', urlRole);
            }
            if(urlName){
                localStorage.setItem('name', urlName);
            }
            // Clean URL immediately
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const token = localStorage.getItem('token');
        if (!token) {
            return { user: null, isLoading: false };
        }

        const decoded: DecodedToken = jwtDecode(token);

        // Check expiry
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            return { user: null, isLoading: false };
        }

        // Create user
        const user: User = {
            id: decoded.id || 'unknown',
            name: localStorage.getItem('name') || '',
            email: decoded.email || '',
            role: decoded.role || localStorage.getItem('role') || 'viewer'
        };

        return { user, isLoading: false };
    } catch (error) {
        console.error('Initial auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return { user: null, isLoading: false };
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Initialize state synchronously from token
    const initialState = getInitialAuthState();
    const [user, setUser] = useState<User | null>(initialState.user);
    const [isLoading, setIsLoading] = useState(initialState.isLoading);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
        window.location.href = import.meta.env.VITE_ADMIN_LOGIN_URL;
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};