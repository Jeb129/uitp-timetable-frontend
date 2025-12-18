// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- Стейты UI ---
    const [activeTab, setActiveTab] = useState('info');
    const [viewMode, setViewMode] = useState('cards');

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
        const fetchUserData = async () => {
            if (user) {
                setUserInfo(prev => ({
                    ...prev,
                    login: user.email ? user.email.split('@')[0] : "user",
                    email: user.email || "",
                    role: user.role === 'admin' ? "Администратор" : "Пользователь",
                }));

                try {
                    const response = await privateApi.post('/database/get/User', {
                        id: user.id
                    });

                    const userData = Array.isArray(response.data) ? response.data[0] : response.data;

                    if (userData) {
                        setUserInfo(prev => ({
                            ...prev,
                            fullName: userData.full_name || prev.fullName || "Иванов Иван Иванович",
                            phone: userData.phone || prev.phone || "+7 (999) 000-00-00",
                            isConfirmed: userData.confirmed || false
                        }));
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

        // ИСПОЛЬЗУЕМ ПОДГРУЖЕННЫЙ НОМЕР АУДИТОРИИ
        // Если classroom_number был успешно найден, выводим его (например "Аудитория Б-101")
        // Если нет — выводим ID как запасной вариант.
        const roomName = bk.classroom_number
            ? `Аудитория ${bk.classroom_number}`
            : `Аудитория (ID: ${bk.classroom_id})`;

        return {
            id: bk.id,
            room: roomName,
            date: dateStr,
            time: `${startTimeStr} - ${endTimeStr}`,
            status: statusStr,
            equipment: [] // Оборудование можно подгружать аналогично, если нужно
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

                    // Нормализуем ответ в массив
                    const bookingsData = Array.isArray(response.data) ? response.data : [response.data];

                    // 2. Для каждого бронирования делаем запрос к таблице Classroom, чтобы узнать номер
                    // Используем Promise.all для параллельного выполнения запросов
                    const enrichedBookings = await Promise.all(bookingsData.map(async (booking) => {
                        try {
                            // Запрашиваем Classroom по id
                            const roomResponse = await privateApi.post('/database/get/Classroom', {
                                id: booking.classroom_id
                            });

                            // Получаем объект аудитории
                            const roomData = Array.isArray(roomResponse.data)
                                ? roomResponse.data[0]
                                : roomResponse.data;

                            // Возвращаем объект бронирования + поле classroom_number
                            return {
                                ...booking,
                                classroom_number: roomData ? roomData.number : null // Берем поле 'number' из модели
                            };
                        } catch (err) {
                            console.error(`Не удалось получить данные для аудитории ID ${booking.classroom_id}`, err);
                            // Если ошибка (например аудитория удалена), возвращаем бронь без номера
                            return booking;
                        }
                    }));

                    // 3. Преобразуем данные для отображения
                    const mappedData = enrichedBookings.map(mapBackendBookingToFrontend);

                    // Сортируем: новые сверху
                    mappedData.sort((a, b) => b.id - a.id);

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


    // --- Остальной код страницы (Редактирование, Logout и т.д.) без изменений ---
    const handleEditClick = () => {
        setEditForm({ fullName: userInfo.fullName, phone: userInfo.phone });
        setIsEditing(true);
        setSaveError('');
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setSaveError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!editForm.fullName.trim()) return "ФИО не может быть пустым";
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
            await privateApi.post('/database/update/User', {
                id: user.id,
                full_name: editForm.fullName,
                phone: editForm.phone
            });

            setUserInfo(prev => ({
                ...prev,
                fullName: editForm.fullName,
                phone: editForm.phone
            }));
            setIsEditing(false);
        } catch (err) {
            console.error("Ошибка сохранения:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setSaveError(err.response.data.error);
            } else {
                setSaveError("Не удалось сохранить изменения.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusColor = (s) => (s==='confirmed'?'status-confirmed':s==='pending'?'status-pending':'status-rejected');
    const translateStatus = (s) => (s==='pending'?'На модерации':s==='confirmed'?'Подтверждено':s==='rejected'?'Отклонено':s);
    const toggleViewMode = () => setViewMode(viewMode === 'cards' ? 'table' : 'cards');

    if (!user) {
        return (
            <div className="profile-page">
                <div style={{color: "black", textAlign: 'center', marginTop: '50px'}}>
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
                                {saveError && <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>{saveError}</div>}
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Email:</label>
                                        <span>{userInfo.email}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>ФИО:</label>
                                        {isEditing ? (
                                            <input type="text" name="fullName" className="profile-input" value={editForm.fullName} onChange={handleInputChange} placeholder="Фамилия Имя Отчество" />
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
                                            <input type="tel" name="phone" className="profile-input" value={editForm.phone} onChange={handleInputChange} placeholder="+7 (999) 000-00-00" />
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
                                        <button className="edit-button" onClick={handleEditClick}>Редактировать профиль</button>
                                        <button className="edit-button" style={{backgroundColor: '#28a745'}} onClick={() => navigate('/kgu-confirm')}>Подтвердить аккаунт КГУ</button>
                                        <button onClick={handleLogout} className="logout-button">Выйти</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="edit-button" style={{backgroundColor: '#007bff'}} onClick={handleSaveClick} disabled={isSaving}>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</button>
                                        <button className="logout-button" style={{backgroundColor: '#6c757d'}} onClick={handleCancelClick} disabled={isSaving}>Отмена</button>
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
                                    <button className="book-room-button" onClick={() => navigate('/map')}>Перейти к бронированию</button>
                                </div>
                            ) : viewMode === 'cards' ? (
                                <div className="bookings-list">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className="booking-card">
                                            <div className="booking-header">
                                                <h4>{booking.room}</h4>
                                                <span className={`status-badge ${getStatusColor(booking.status)}`}>{translateStatus(booking.status)}</span>
                                            </div>
                                            <div className="booking-details">
                                                <div className="booking-info">
                                                    <span className="booking-date">{booking.date}</span>
                                                    <span className="booking-time">{booking.time}</span>
                                                </div>
                                            </div>
                                            <div className="booking-actions">
                                                <button className="action-button view">Подробнее</button>
                                                {booking.status === 'pending' && <button className="action-button cancel">Отменить</button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bookings-table-container">
                                    <table className="bookings-table">
                                        <thead>
                                        <tr>
                                            <th>Номер</th><th>Аудитория</th><th>Дата</th><th>Время</th><th>Статус</th><th>Действия</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {bookings.map(booking => (
                                            <tr key={booking.id}>
                                                <td className="booking-id">#{booking.id}</td>
                                                <td className="booking-room">{booking.room}</td>
                                                <td className="booking-date">{booking.date}</td>
                                                <td className="booking-time">{booking.time}</td>
                                                <td><span className={`status-badge ${getStatusColor(booking.status)}`}>{translateStatus(booking.status)}</span></td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="action-button view">Инфо</button>
                                                        {booking.status === 'pending' && <button className="action-button cancel">Отмена</button>}
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