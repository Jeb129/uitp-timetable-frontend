// src/pages/ProfilePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return <div>Загрузка...</div>; // или редирект на /login
    }

    return (
        <div className="profile-page">
            <h2>Профиль</h2>
            <p>Добро пожаловать, {user.login}!</p>
            <button onClick={handleLogout} className="auth-button">Выйти</button>
        </div>
    );
};

export default ProfilePage;