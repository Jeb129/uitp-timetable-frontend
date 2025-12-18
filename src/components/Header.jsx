// src/components/Header.jsx
import React, {useEffect, useState, useCallback} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios';

import BellIcon from './icons/header/BellIcon';
import ProfileIcon from './icons/header/ProfileIcon';
import HelpIcon from './icons/header/HelpIcon';
import CheckIcon from './icons/header/CheckIcon';
import RulesModal from './modals/RulesModal.jsx';
import TimeRangeModal from './modals/TimeRangeModal.jsx';
import './Header.css';

import { getFilteredTimes } from '../utils/rulesValidation.js';
import { useFilters } from "../contexts/FilterContext.jsx";

const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
    return date.toLocaleDateString();
};

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { filters, updateFilter, roomStats } = useFilters();

    const userType = user?.role || 'guest';
    const isMapPage = location.pathname === '/map';

    const [selectedTime, setSelectedTime] = useState(filters.time || '');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isTimeRangeModalOpen, setIsTimeRangeModalOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!filters.date) {
            updateFilter('date', today);
        }
    }, []);

    // --- ЛОГИКА УВЕДОМЛЕНИЙ ---

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        try {
            // Используем имя модели в нижнем регистре, как в WEB_ABLE_MODELS
            const response = await privateApi.post('/database/get/notification', {
                user_id: user.id,
            });

            const data = response.data?.results || response.data || [];
            const notificationsArray = Array.isArray(data) ? data : [data];

            const mappedNotifications = notificationsArray.map(n => ({
                id: n.id,
                text: n.message || 'Без текста',
                time: formatRelativeTime(n.created_at),
                // ИСПРАВЛЕНО: Проверяем статус 'read' вместо поля is_read
                read: n.status === 'read'
            }));

            // Сортируем: сначала новые
            mappedNotifications.sort((a, b) => b.id - a.id);

            setNotifications(mappedNotifications);
        } catch (error) {
            console.error("Ошибка получения уведомлений:", error);
            setNotifications([]);
        }
    }, [user]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const toggleNotifications = () => {
        const newState = !showNotifications;
        setShowNotifications(newState);

        if (newState) {
            loadNotifications();
        }
    };

    // Функция отметки уведомления как прочитанного
    const toggleReadStatus = async (id) => {
        // Оптимистичное обновление UI
        setNotifications(prevNotifications =>
            prevNotifications.map(not =>
                not.id === id ? { ...not, read: true } : not
            )
        );

        if (user) {
            try {
                // ИСПРАВЛЕНО:
                // 1. Плоская структура JSON (без updates: {})
                // 2. Меняем поле status на 'read'
                await privateApi.post('/database/update/notification', {
                    id: id,
                    status: 'read'
                });
            } catch (error) {
                console.error("Не удалось обновить статус уведомления:", error);
                loadNotifications();
            }
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.length === 0) return;

        try {
            setNotifications(prevNotifications =>
                prevNotifications.map(not => ({ ...not, read: true }))
            );

            const unreadNotifications = notifications.filter(n => !n.read);

            // Отправляем запросы параллельно для скорости
            await Promise.all(unreadNotifications.map(not =>
                privateApi.post('/database/update/notification', {
                    id: not.id,
                    status: 'read'
                })
            ));

        } catch (error) {
            console.error("Не удалось отметить все уведомления как прочитанные:", error);
            loadNotifications();
        }
    };
    // --- КОНЕЦ ЛОГИКИ УВЕДОМЛЕНИЙ ---

    useEffect(() => {
        if (isMapPage) {
            const times = getFilteredTimes(userType);
            setAvailableTimes(times);
            if (filters.time) {
                setSelectedTime(filters.time);
            }
        }
    }, [userType, isMapPage, filters.time]);

    const goToProfileOrLogin = () => {
        if (user) {
            navigate('/profile');
        } else {
            navigate('/login');
        }
    };

    const handleRulesClick = () => setIsRulesModalOpen(true);
    const closeRulesModal = () => setIsRulesModalOpen(false);
    const handleTimeRangeClick = () => setIsTimeRangeModalOpen(true);
    const closeTimeRangeModal = () => setIsTimeRangeModalOpen(false);

    const handleTimeRangeSelect = (timeRange) => {
        setSelectedTime(timeRange);
        updateFilter('time', timeRange);
        setIsTimeRangeModalOpen(false);
    };

    const handleDateChange = (e) => {
        updateFilter('date', e.target.value);
    };

    const getTimeInfoText = () => {
        if (availableTimes.length === 0) {
            return userType === 'external'
                ? 'Для внешних пользователей: 8:00-17:00 (Пн-Сб)'
                : 'Бронирование недоступно (воскресенье)';
        }
        const firstTime = availableTimes[0];
        const lastTime = availableTimes[availableTimes.length - 1];
        const start = firstTime.start || firstTime.value.split(' - ')[0];
        const end = lastTime.end || lastTime.value.split(' - ')[1];
        return `Доступно: ${start} - ${end}`;
    };

    const handleSeatsChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            updateFilter('minCapacity', value === '' ? 0 : parseInt(value));
        }
    };

    const handleFloorChange = (e) => updateFilter('floor', e.target.value);
    const handleCorpusChange = (e) => updateFilter('corpus', e.target.value);

    // Считаем количество непрочитанных (статус != 'read')
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <header className="header">
                <div className="header-main">
                    <h1 className="page-title">
                        {isMapPage ? 'Карта' :
                            location.pathname === '/calendar' ? 'Календарь' :
                                location.pathname === '/auditoriums' ? 'Аудитории' :
                                    location.pathname === '/schedule' ? 'Расписание' :
                                        location.pathname === '/profile' ? 'Профиль' :
                                            location.pathname === '/rules' ? 'Правила' :
                                                location.pathname === '/admin' ? 'Администрирование' :
                                                    'КГУ'}
                    </h1>
                    <div className="header-actions">
                        {user && (
                            <div className="notification-dropdown">
                                <button
                                    className="icon-btn"
                                    onClick={toggleNotifications}
                                    style={{position: 'relative'}}
                                    aria-label="Уведомления"
                                >
                                    <BellIcon />
                                    {unreadCount > 0 && (
                                        <span
                                            className="notification-badge"
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: 'red',
                                                borderRadius: '50%'
                                            }}
                                            aria-label={`${unreadCount} непрочитанных уведомлений`}
                                        ></span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="notification-menu">
                                        <div className="notification-header">
                                            <h3>Уведомления</h3>
                                            <div className="notification-actions">
                                                {unreadCount > 0 && (
                                                    <button
                                                        className="mark-all-read-btn"
                                                        onClick={markAllAsRead}
                                                    >
                                                        Прочитать все
                                                    </button>
                                                )}
                                                <button
                                                    className="close-btn"
                                                    onClick={() => setShowNotifications(false)}
                                                    aria-label="Закрыть уведомления"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                        <ul className="notification-list">
                                            {notifications.length === 0 ? (
                                                <li
                                                    className="notification-item"
                                                    style={{justifyContent: 'center', color: '#888'}}
                                                >
                                                    Нет уведомлений
                                                </li>
                                            ) : (
                                                notifications.map((not) => (
                                                    <li
                                                        key={not.id}
                                                        className={`notification-item ${not.read ? 'read' : 'unread'}`}
                                                    >
                                                        <div className="notification-content">
                                                            <p className="notification-text">{not.text}</p>
                                                            <span className="notification-time">{not.time}</span>
                                                        </div>
                                                        {!not.read && (
                                                            <button
                                                                className={`read-button unread`}
                                                                onClick={() => toggleReadStatus(not.id)}
                                                                title="Отметить как прочитанное"
                                                            >
                                                                <CheckIcon />
                                                            </button>
                                                        )}
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            className="icon-btn"
                            onClick={goToProfileOrLogin}
                            aria-label={user ? "Профиль" : "Войти"}
                        >
                            <ProfileIcon />
                        </button>
                    </div>
                </div>

                {isMapPage && (
                    <div className="header-secondary visible">
                        <div className="filter-group">
                            <div className="filter-with-label">
                                <label className="filter-label">Корпус</label>
                                <select
                                    value={filters.corpus || 'Б'}
                                    onChange={handleCorpusChange}
                                    className="corpus-select"
                                >
                                    <option value="А">А</option>
                                    <option value="Б">Б</option>
                                    <option value="В">В</option>
                                </select>
                            </div>

                            <div className="filter-with-label">
                                <label className="filter-label">Этаж</label>
                                <select
                                    value={filters.floor || '1'}
                                    onChange={handleFloorChange}
                                    className="floor-select"
                                >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </div>

                            <div className="filter-with-label">
                                <label className="filter-label">Тип</label>
                                <select
                                    value={filters.roomType || 'all'}
                                    onChange={(e) => updateFilter('roomType', e.target.value)}
                                    className="type-select"
                                >
                                    <option value="all">Все</option>
                                    <option value="lecture">Лекционная</option>
                                    <option value="computer">Компьютерная</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>

                            <div className="filter-with-label">
                                <label className="filter-label">Дата</label>
                                <input
                                    type="date"
                                    value={filters.date || today}
                                    onChange={handleDateChange}
                                    min={today}
                                    className="date-input"
                                    style={{
                                        padding: '6px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div className="filter-with-label time-filter">
                                <label className="filter-label">Время</label>
                                <div className="time-select-wrapper">
                                    <button
                                        className="time-range-btn"
                                        onClick={handleTimeRangeClick}
                                    >
                                        {selectedTime || 'Выбрать время'}
                                    </button>
                                    {availableTimes.length > 0 ? (
                                        <div className="time-info-tooltip">{getTimeInfoText()}</div>
                                    ) : (
                                        <div className="time-unavailable">Бронирование недоступно</div>
                                    )}
                                </div>
                            </div>

                            <div className="filter-with-label">
                                <label className="filter-label">Мест</label>
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={filters.minCapacity > 0 ? filters.minCapacity : ''}
                                    onChange={handleSeatsChange}
                                    className="seats-input"
                                    maxLength={3}
                                    inputMode="numeric"
                                />
                            </div>

                            <div className="auditoriums-section">
                                <label className="auditoriums-label">Статистика</label>
                                <div className="auditoriums-stats single-stat">
                                    <span className="stat-item">
                                        Найдено: <strong>{roomStats.found}</strong>
                                    </span>
                                </div>
                            </div>

                            <button
                                className="icon-btn"
                                onClick={handleRulesClick}
                                aria-label="Правила бронирования"
                            >
                                <HelpIcon />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {isRulesModalOpen && <RulesModal onClose={closeRulesModal} />}
            {isTimeRangeModalOpen && (
                <TimeRangeModal
                    onClose={closeTimeRangeModal}
                    onSelect={handleTimeRangeSelect}
                    selectedTime={selectedTime}
                    userType={userType}
                />
            )}
        </>
    );
};

export default Header;