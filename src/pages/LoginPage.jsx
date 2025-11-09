// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [login, setLogin] = useState('22-isbo-104');
    const [password, setPassword] = useState('');
    const { login: loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (login && password) {
            loginUser({ login });
            navigate('/profile');
        }
    };

    return (
        <div className="login-page-centered">
            <div className="login-form-container">
                <h1>Зайдите на СДО КГУ</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="22-isbo-104"
                        className="login-input"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="login-button">Вход</button>
                </form>
                <div className="login-footer">
                    <Link to="#" className="forgot-password">Забыли пароль?</Link>
                </div>
                <div className="guest-button">
                    <Link to="/register" className="guest-link">Зарегистрироваться как пользователь</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;