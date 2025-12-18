import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../utils/api/auth';
import { privateApi } from '../utils/api/axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// Вспомогательная функция (оставляем, чтобы доставать роль из токена без запроса к БД)
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Функция инициализации пользователя из токена
    const initializeUser = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const decoded = parseJwt(token);
            // Проверка срока действия (exp в секундах)
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser({
                    id: decoded.user_id,
                    role: decoded.role,
                    email: decoded.sub || decoded.email // Поле зависит от того, как бэк собирает токен
                });
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        initializeUser();
    }, []);

    // Обертка над apiLogin
    const login = async (email, password) => {
        // Вызываем функцию из auth.js
        // Она сама сохраняет токены в localStorage
        await apiLogin(email, password);

        // После успешного входа обновляем стейт
        initializeUser();
    };

    const logout = () => {
        apiLogout(); // Чистит storage и делает reload
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};