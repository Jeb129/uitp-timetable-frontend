// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios'; // Используем настроенный инстанс с токенами
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- Стейты UI ---
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'bookings'
    const [viewMode, setViewMode] = useState('cards');  // 'cards' | 'table'

    // --- Стейты Данных ---
    const [userInfo, setUserInfo] = useState({
        login: "user",
        email: "",
        role: "Пользователь",
        fullName: "",
        phone: "",
        department: "Не указано"
    });

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // --- Стейты Редактирования ---
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
    const [saveError, setSaveError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // --- Инициализация данных пользователя ---
    useEffect(() => {
        if (user) {
            // Базовые данные берем из токена
            setUserInfo(prev => ({
                ...prev,
                login: user.email ? user.email.split('@')[0] : "user",
                email: user.email || "",
                role: user.role === 'admin' ? "Администратор" : "Пользователь",

                fullName: prev.fullName || "Иванов Иван Иванович",
                phone: prev.phone || "+7 (999) 000-00-00",
                department: "Факультет информационных технологий"
            }));
        }
    }, [user]);

    // --- Логика Бронирований ---

    // Преобразование формата бэкенда в формат фронтенда
    const mapBackendBookingToFrontend = (bk) => {
        const startDate = new Date(bk.date);
        const dateStr = startDate.toLocaleDateString('ru-RU');
        const startTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // duration приходит в минутах
        const durationMin = bk.duration || 60;
        const endDate = new Date(startDate.getTime() + durationMin * 60000);
        const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
            id: bk.id,
            room: `Аудитория ${bk.classroom_number}`,
            date: dateStr,
            time: `${startTimeStr} - ${endTimeStr}`,
            status: bk.status || 'pending',
            equipment: [] // Бэкенд пока не возвращает список оборудования
        };
    };

    // Загрузка бронирований
    useEffect(() => {
        const fetchBookings = async () => {
            if (user && user.id) {
                setLoadingBookings(true);
                try {
                    // Используем privateApi, токен подставится сам
                    const response = await privateApi.get('/booking/search', {
                        params: {
                            key: 'user_id',
                            value: user.id
                        }
                    });

                    const mappedData = response.data.map(mapBackendBookingToFrontend);
                    setBookings(mappedData.reverse()); // Новые сверху
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


    // --- Логика Редактирования ---

    const handleEditClick = () => {
        setEditForm({
            fullName: userInfo.fullName,
            phone: userInfo.phone
        });
        setIsEditing(true);
        setSaveError('');
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setSaveError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!editForm.fullName.trim()) return "ФИО не может быть пустым";
        // Простой regex для телефона (можно усложнить)
        const phoneRegex = /^(\+7|8)?[\s-]?\(?[489][0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
        if (!phoneRegex.test(editForm.phone)) return "Некорректный формат телефона";
        return null;
    };

    const handleSaveClick = async () => {
        const error = validateForm();
        if (error) {
            setSaveError(error);
            return;
        }

        setIsSaving(true);
        setSaveError('');

        try {
            await privateApi.post('/user/update', {
                user_id: user.id,
                full_name: editForm.fullName,
                phone: editForm.phone
            });

            // Обновляем локальный стейт
            setUserInfo(prev => ({
                ...prev,
                fullName: editForm.fullName,
                phone: editForm.phone
            }));

            setIsEditing(false);

        } catch (err) {
            console.error("Ошибка сохранения:", err);
            setSaveError("Не удалось сохранить изменения. Попробуйте позже.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login'); // logout делает reload, но на всякий случай
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'status-confirmed';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    const translateStatus = (status) => {
        const map = {
            'pending': 'На модерации',
            'confirmed': 'Подтверждено',
            'rejected': 'Отклонено'
        };
        return map[status] || status;
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'cards' ? 'table' : 'cards');
    };

    // Если пользователь не авторизован
    if (!user) {
        return (
            <div className="profile-page">
                <div style={{textAlign: 'center', marginTop: '50px'}}>
                    <h2>Доступ запрещен</h2>
                    <p>Пожалуйста, войдите в систему.</p>
                    <button className="login-button" onClick={() => navigate('/login')} style={{marginTop: '20px'}}>
                        Войти
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h2>Профиль пользователя</h2>
                    <p>Добро пожаловать, {userInfo.email}!</p>
                </div>

                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                        disabled={isEditing}
                    >
                        Информация
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                        disabled={isEditing}
                    >
                        Бронирования
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'info' && (
                        <div className="info-tab">
                            <div className="user-info-card">
                                <h3>Личная информация</h3>

                                {saveError && (
                                    <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>
                                        {saveError}
                                    </div>
                                )}

                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Email:</label>
                                        <span>{userInfo.email}</span>
                                    </div>

                                    <div className="info-item">
                                        <label>ФИО:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="fullName"
                                                className="profile-input"
                                                value={editForm.fullName}
                                                onChange={handleInputChange}
                                                placeholder="Фамилия Имя Отчество"
                                            />
                                        ) : (
                                            <span>{userInfo.fullName}</span>
                                        )}
                                    </div>

                                    <div className="info-item">
                                        <label>Роль:</label>
                                        <span>{userInfo.role}</span>
                                    </div>

                                    <div className="info-item">
                                        <label>Телефон:</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="profile-input"
                                                value={editForm.phone}
                                                onChange={handleInputChange}
                                                placeholder="+7 (999) 000-00-00"
                                            />
                                        ) : (
                                            <span>{userInfo.phone}</span>
                                        )}
                                    </div>

                                    <div className="info-item">
                                        <label>Отдел/Факультет:</label>
                                        <span>{userInfo.department}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-actions" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                {!isEditing ? (
                                    <>
                                        <button className="edit-button" onClick={handleEditClick}>
                                            Редактировать профиль
                                        </button>

                                        <button
                                            className="edit-button"
                                            style={{backgroundColor: '#28a745'}}
                                            onClick={() => navigate('/kgu-confirm')}
                                        >
                                            Подтвердить аккаунт КГУ
                                        </button>

                                        <button onClick={handleLogout} className="logout-button">
                                            Выйти
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="edit-button"
                                            style={{backgroundColor: '#007bff'}}
                                            onClick={handleSaveClick}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                                        </button>

                                        <button
                                            className="logout-button"
                                            style={{backgroundColor: '#6c757d'}}
                                            onClick={handleCancelClick}
                                            disabled={isSaving}
                                        >
                                            Отмена
                                        </button>
                                    </>
                                )}
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
                                                {booking.equipment.length > 0 && (
                                                    <div className="booking-equipment">
                                                        <strong>Оборудование:</strong>
                                                        {booking.equipment.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="booking-actions">
                                                <button className="action-button view">Подробнее</button>
                                                {booking.status === 'pending' && (
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
                                                        {translateStatus(booking.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="action-button view">Инфо</button>
                                                        {booking.status === 'pending' && (
                                                            <button className="action-button cancel">Отмена</button>
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