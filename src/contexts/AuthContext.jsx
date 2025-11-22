// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const isAdmin = () => {
    return user && user.role === 'admin';
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // null = не авторизован
    const [loading, setLoading] = useState(true);

    // Проверяем, есть ли токен в localStorage (или где-то ещё)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Запрос на бэк
            // setUser(...);
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // Здесь будет запрос на бэк
        setUser(userData);
        localStorage.setItem('token', 'fake-token'); // Пример
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};