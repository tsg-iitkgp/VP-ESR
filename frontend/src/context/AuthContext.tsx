import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

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
    iss?: string;
    aud?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Exchange authorization code with backend
const exchangeCodeForToken = async (code: string): Promise<{ token: string; user: User } | null> => {
    try {
        const apiUrl = import.meta.env.VITE_APP_API_PREFIX || 'http://localhost:5001';
        const response = await fetch(`${apiUrl}/api/auth/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            console.error('Failed to exchange code:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error exchanging code:', error);
        return null;
    }
};

// Get auth state from localStorage token
const getAuthStateFromToken = (): User | null => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const decoded: DecodedToken = jwtDecode(token);

        // Check expiry
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            return null;
        }

        // Validate issuer and audience
        if (decoded.iss !== 'admin-backend' || decoded.aud !== 'vp-esr') {
            console.error('Invalid token claims');
            localStorage.removeItem('token');
            return null;
        }

        return {
            id: decoded.id || 'unknown',
            name: localStorage.getItem('name') || '',
            email: decoded.email || '',
            role: decoded.role || localStorage.getItem('role') || 'viewer'
        };
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        return null;
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check for authorization code in URL
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const name = urlParams.get('name');

            if (code) {
                // Clean URL immediately
                window.history.replaceState({}, document.title, window.location.pathname);

                // Exchange code for token via backend
                const result = await exchangeCodeForToken(code);
                result.user.name = name;
                if (result) {
                    localStorage.setItem('token', result.token);
                    if (result.user.role) localStorage.setItem('role', result.user.role);
                    if (result.user.name) localStorage.setItem('name', result.user.name);
                    setUser(result.user);
                }
                setIsLoading(false);
                return;
            }

            // No code, check existing token
            const existingUser = getAuthStateFromToken();
            setUser(existingUser);
            setIsLoading(false);
            console.log(localStorage.getItem('name'));
        };

        initAuth();
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
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