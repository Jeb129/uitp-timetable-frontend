import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../utils/api/axios'; // Импорт публичного API
import './LoginPage.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }

        try {
            // Используем publicApi
            // ЗАмени на метод register из auth.js - Илья
            await publicApi.post('/auth/register/', {
                email: email,
                password: password
            });

            alert('Регистрация прошла успешно! Теперь войдите в систему.');
            navigate('/login');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Ошибка при регистрации. Возможно, пользователь уже существует.');
            }
        }
    };

    return (
        <div className="login-page-centered">
            <div className="login-form-container">
                <h1>Регистрация</h1>
                {error && <div className="error-message" style={{color: 'red', marginBottom: '10px', textAlign: 'center'}}>{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Пароль" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <input type="password" placeholder="Повторите пароль" className="login-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="submit" className="login-button">Зарегистрироваться</button>
                </form>

                <div className="login-footer" style={{ marginTop: '15px', textAlign: 'center' }}>
                    <span style={{color: '#666'}}>Уже есть аккаунт? </span>
                    <Link to="/login" className="forgot-password">Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;