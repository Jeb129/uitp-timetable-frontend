// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';

const RegisterPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Пример регистрации
        alert('Регистрация успешна!');
        navigate('/login');
    };

    return (
        <div className="register-page-centered">
            <div className="register-form-container">
                <h1>Регистрация</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Логин"
                        className="register-input"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        className="register-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="register-button">Зарегистрироваться</button>
                </form>
                <div className="register-footer">
                    <Link to="/login" className="login-link">Уже есть аккаунт? Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;