import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (email && password) {
            try {
                await login(email, password);
                navigate('/profile');

            } catch (err) {
                console.error("Login failed:", err);
                if (err.response && err.response.data && err.response.data.message) {
                    setError(err.response.data.message);
                } else {
                    setError('Неверный логин или пароль');
                }
            }
        } else {
            setError('Пожалуйста, заполните все поля');
        }
    };

    return (
        <div className="login-page-centered">
            <div className="login-form-container">
                <h1>Зайдите на СДО КГУ</h1>

                {error && <div className="error-message" style={{color: 'red', marginBottom: '10px', textAlign: 'center'}}>{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="login-button">Вход</button>
                </form>

                <div className="login-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    <Link to="#" className="forgot-password">Забыли пароль?</Link>
                    <Link to="/register" className="forgot-password">Регистрация</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;