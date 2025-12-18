// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios';
import { logout as clearTokens } from '../utils/api/auth';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- Стейты UI ---
    const [activeTab, setActiveTab] = useState('info');
    const [viewMode, setViewMode] = useState('cards');

    // --- Стейты Данных ---
    const [userInfo, setUserInfo] = useState({
        email: "",
        role: "Внешний пользователь",
        isConfirmed: false
    });

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Хелпер для отображения названия роли
    const getRoleName = (role) => {
        switch (role) {
            case 'admin': return 'Администратор';
            case 'kgu': return 'Пользователь КГУ';
            case 'user': return 'Внешний пользователь';
            default: return role || 'Гость';
        }
    };

    // --- Инициализация данных пользователя ---
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                // 1. Устанавливаем данные из контекста/токена
                setUserInfo({
                    email: user.email || "",
                    role: getRoleName(user.role),
                    isConfirmed: false // По умолчанию, пока не загрузим с бэка
                });

                try {
                    // 2. Запрашиваем актуальный статус из БД
                    const response = await privateApi.post('/database/get/User', {
                        id: user.id
                    });

                    const userData = Array.isArray(response.data) ? response.data[0] : response.data;

                    if (userData) {
                        setUserInfo({
                            email: userData.email,
                            role: getRoleName(userData.role),
                            isConfirmed: userData.confirmed || false
                        });
                    }
                } catch (error) {
                    console.error("Ошибка получения данных пользователя:", error);
                }
            }
        };

        fetchUserData();
    }, [user]);

    // --- Логика Бронирований ---

    const mapBackendBookingToFrontend = (bk) => {
        const startDate = new Date(bk.date_start);
        const endDate = new Date(bk.date_end);

        const dateStr = startDate.toLocaleDateString('ru-RU');
        const startTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let statusStr = 'pending';
        if (bk.status === true) statusStr = 'confirmed';
        if (bk.status === false) statusStr = 'rejected';

        // Формируем название комнаты
        const roomName = bk.classroom_number
            ? `Аудитория ${bk.classroom_number}`
            : `Аудитория (ID: ${bk.classroom_id})`;

        return {
            id: bk.id,
            room: roomName,
            date: dateStr,
            time: `${startTimeStr} - ${endTimeStr}`,
            status: statusStr,
            equipment: []
        };
    };

    // Загрузка бронирований с "обогащением" данными об аудитории
    useEffect(() => {
        const fetchBookings = async () => {
            if (user && user.id) {
                setLoadingBookings(true);
                try {
                    // 1. Получаем список бронирований
                    const response = await privateApi.post('/database/get/Booking', {
                        user_id: user.id
                    });

                    const bookingsData = Array.isArray(response.data) ? response.data : [response.data];

                    // 2. Подгружаем номера аудиторий
                    const enrichedBookings = await Promise.all(bookingsData.map(async (booking) => {
                        try {
                            const roomResponse = await privateApi.post('/database/get/Classroom', {
                                id: booking.classroom_id
                            });

                            const roomData = Array.isArray(roomResponse.data)
                                ? roomResponse.data[0]
                                : roomResponse.data;

                            return {
                                ...booking,
                                classroom_number: roomData ? roomData.number : null
                            };
                        } catch (err) {
                            return booking;
                        }
                    }));

                    const mappedData = enrichedBookings.map(mapBackendBookingToFrontend);
                    mappedData.sort((a, b) => b.id - a.id); // Новые сверху

                    setBookings(mappedData);
                } catch (error) {
                    console.error("Ошибка загрузки бронирований:", error);
                } finally {
                    setLoadingBookings(false);
                }
            }
        };

        if (activeTab === 'bookings') {
            fetchBookings();
        }
    }, [user, activeTab]);

    const handleLogout = () => {
        clearTokens();
        logout();
        navigate('/login');
    };

    const getStatusColor = (s) => (s==='confirmed'?'status-confirmed':s==='pending'?'status-pending':'status-rejected');
    const translateStatus = (s) => (s==='pending'?'На модерации':s==='confirmed'?'Подтверждено':s==='rejected'?'Отклонено':s);
    const toggleViewMode = () => setViewMode(viewMode === 'cards' ? 'table' : 'cards');

    // Если пользователь не авторизован
    // if (!user) {
    //     return (
    //         <div className="profile-page">
    //             <div style={{color: "black", textAlign: 'center', marginTop: '50px'}}>
    //                 <h2>Доступ запрещен</h2>
    //                 <p>Пожалуйста, войдите в систему.</p>
    //                 <button className="login-button" onClick={() => navigate('/login')} style={{marginTop: '20px'}}>
    //                     Войти
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h2>Профиль пользователя</h2>
                    <p>Добро пожаловать!</p>
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
                                <h3>Учетная запись</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Email:</label>
                                        <span>{userInfo.email}</span>
                                    </div>

                                    <div className="info-item">
                                        <label>Роль:</label>
                                        <span>{userInfo.role}</span>
                                    </div>

                                    <div className="info-item">
                                        <label>Статус аккаунта:</label>
                                        <span className={userInfo.isConfirmed ? "status-confirmed-text" : "status-pending-text"}>
                                            {userInfo.isConfirmed ? "Подтвержден (СДО)" : "Не подтвержден"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-actions" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                {/* Кнопку подтверждения показываем, только если аккаунт еще не подтвержден и это не админ */}
                                {/* Используем user?.role с безопасным доступом */}
                                {!userInfo.isConfirmed && user?.role !== 'admin' && (
                                    <button
                                        className="edit-button"
                                        style={{backgroundColor: '#28a745'}}
                                        onClick={() => navigate('/kgu-confirm')}
                                    >
                                        Подтвердить аккаунт КГУ
                                    </button>
                                )}

                                <button onClick={handleLogout} className="logout-button">
                                    Выйти
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bookings-tab">
                            <div className="bookings-header">
                                <h3>Мои бронирования</h3>
                                <button className="view-toggle-button" onClick={toggleViewMode}>
                                    {viewMode === 'cards' ? 'Таблица' : 'Карточки'}
                                </button>
                            </div>

                            {loadingBookings ? (
                                <div style={{textAlign: 'center', padding: '30px', color: '#666'}}>Загрузка бронирований...</div>
                            ) : bookings.length === 0 ? (
                                <div className="no-bookings">
                                    <p>У вас пока нет активных бронирований</p>
                                    <button
                                        className="book-room-button"
                                        onClick={() => navigate('/map')}
                                    >
                                        Перейти к бронированию
                                    </button>
                                </div>
                            ) : viewMode === 'cards' ? (
                                <div className="bookings-list">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className="booking-card">
                                            <div className="booking-header">
                                                <h4>{booking.room}</h4>
                                                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                                    {translateStatus(booking.status)}
                                                </span>
                                            </div>
                                            <div className="booking-details">
                                                <div className="booking-info">
                                                    <span className="booking-date">{booking.date}</span>
                                                    <span className="booking-time">{booking.time}</span>
                                                </div>
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
                                                        {translateStatus(booking.status)}
                                                    </span>
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