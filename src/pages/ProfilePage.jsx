// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    // const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('info');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' или 'table'

    // const handleLogout = () => {
    //     logout();
    //     navigate('/login');
    // };
    //
    // if (!user) {
    //     return <div>Загрузка...</div>;
    // }

    // Моковые данные для демонстрации
    const userInfo = {
        // login: user.login,
        login: "user",
        email: "user@example.com",
        fullName: "Иванов Иван Иванович",
        // role: user.role === 'external' ? "Внешний пользователь" : "Сотрудник/Студент",
        role: "Внешний пользователь",
        phone: "+7 (999) 123-45-67",
        department: "Факультет информационных технологий"
    };

    // Моковые данные бронирований
    const bookings = [
        {
            id: 1,
            room: "Аудитория 101",
            date: "2024-01-15",
            time: "10:00 - 12:00",
            status: "Подтверждено",
            equipment: ["Проектор", "Микрофон"]
        },
        {
            id: 2,
            room: "Аудитория 205",
            date: "2024-01-16",
            time: "14:00 - 15:30",
            status: "На модерации",
            equipment: ["Интерактивная доска"]
        },
        {
            id: 3,
            room: "Конференц-зал",
            date: "2024-01-17",
            time: "16:00 - 18:00",
            status: "Отклонено",
            equipment: ["Проектор", "Звуковая система"]
        },
        {
            id: 1,
            room: "Аудитория 101",
            date: "2024-01-15",
            time: "10:00 - 12:00",
            status: "Подтверждено",
            equipment: ["Проектор", "Микрофон"]
        },
        {
            id: 2,
            room: "Аудитория 205",
            date: "2024-01-16",
            time: "14:00 - 15:30",
            status: "На модерации",
            equipment: ["Интерактивная доска"]
        },
        {
            id: 1,
            room: "Аудитория 101",
            date: "2024-01-15",
            time: "10:00 - 12:00",
            status: "Подтверждено",
            equipment: ["Проектор", "Микрофон"]
        },
        {
            id: 2,
            room: "Аудитория 205",
            date: "2024-01-16",
            time: "14:00 - 15:30",
            status: "На модерации",
            equipment: ["Интерактивная доска"]
        },
        {
            id: 1,
            room: "Аудитория 101",
            date: "2024-01-15",
            time: "10:00 - 12:00",
            status: "Подтверждено",
            equipment: ["Проектор", "Микрофон"]
        },
        {
            id: 2,
            room: "Аудитория 205",
            date: "2024-01-16",
            time: "14:00 - 15:30",
            status: "На модерации",
            equipment: ["Интерактивная доска"]
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Подтверждено': return 'status-confirmed';
            case 'На модерации': return 'status-pending';
            case 'Отклонено': return 'status-rejected';
            default: return '';
        }
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'cards' ? 'table' : 'cards');
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h2>Профиль пользователя</h2>
                    <p>Добро пожаловать, {userInfo.login}!</p>
                </div>

                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        Информация
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Бронирования
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'info' && (
                        <div className="info-tab">
                            <div className="user-info-card">
                                <h3>Личная информация</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Логин:</label>
                                        <span>{userInfo.login}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>ФИО:</label>
                                        <span>{userInfo.fullName}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Email:</label>
                                        <span>{userInfo.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Телефон:</label>
                                        <span>{userInfo.phone}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Роль:</label>
                                        <span>{userInfo.role}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Отдел/Факультет:</label>
                                        <span>{userInfo.department}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button className="edit-button">Редактировать профиль</button>
                                <button
                                    // onClick={handleLogout}
                                    className="logout-button">
                                    Выйти из аккаунта
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bookings-tab">
                            <div className="bookings-header">
                                <h3>Мои бронирования</h3>
                                <button
                                    className="view-toggle-button"
                                    onClick={toggleViewMode}
                                >
                                    {viewMode === 'cards' ? 'Таблица' : 'Карточки'}
                                </button>
                            </div>
                            {bookings.length === 0 ? (
                                <div className="no-bookings">
                                    <p>У вас пока нет бронирований</p>
                                    <button
                                        className="book-room-button"
                                        onClick={() => navigate('/booking')}
                                    >
                                        Забронировать аудиторию
                                    </button>
                                </div>
                            ) : viewMode === 'cards' ? (
                                <div className="bookings-list">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className="booking-card">
                                            <div className="booking-header">
                                                <h4>{booking.room}</h4>
                                                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div className="booking-details">
                                                <div className="booking-info">
                                                    <span className="booking-date">{booking.date}</span>
                                                    <span className="booking-time">{booking.time}</span>
                                                </div>
                                                {booking.equipment.length > 0 && (
                                                    <div className="booking-equipment">
                                                        <strong>Оборудование:</strong>
                                                        {booking.equipment.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="booking-actions">
                                                <button className="action-button view">Подробнее</button>
                                                {booking.status === 'На модерации' && (
                                                    <button className="action-button cancel">Отменить</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bookings-table-container">
                                    <table className="bookings-table">
                                        <thead>
                                        <tr>
                                            <th>Номер</th>
                                            <th>Аудитория</th>
                                            <th>Дата</th>
                                            <th>Время</th>
                                            <th>Статус</th>
                                            <th>Действия</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {bookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td className="booking-id">#{booking.id}</td>
                                                <td className="booking-room">{booking.room}</td>
                                                <td className="booking-date">{booking.date}</td>
                                                <td className="booking-time">{booking.time}</td>
                                                <td>
                                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="action-button view">Подробнее</button>
                                                        {booking.status === 'На модерации' && (
                                                            <button className="action-button cancel">Отменить</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;