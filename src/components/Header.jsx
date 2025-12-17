// src/components/Header.jsx
import React, {useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { privateApi } from '../utils/api/axios'; // Импортируем privateApi

import BellIcon from './icons/header/BellIcon';
import ProfileIcon from './icons/header/ProfileIcon';
import HelpIcon from './icons/header/HelpIcon';
import CheckIcon from './icons/header/CheckIcon';
import RulesModal from './modals/RulesModal.jsx';
import TimeRangeModal from './modals/TimeRangeModal.jsx';
import './Header.css';

import { getFilteredTimes } from '../utils/rulesValidation.js';
import {useFilters} from "../contexts/FilterContext.jsx";

// Вспомогательная функция для форматирования времени (из ISO в "X мин назад")
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

    const [corpus, setCorpus] = useState('Б');
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);

    const [showNotifications, setShowNotifications] = useState(false);
    // Изначально пустой массив, загружаем с бэка
    const [notifications, setNotifications] = useState([]);

    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isTimeRangeModalOpen, setIsTimeRangeModalOpen] = useState(false);

    // --- ЛОГИКА УВЕДОМЛЕНИЙ ---

    // Загрузка уведомлений при изменении пользователя
    useEffect(() => {
        const fetchNotifications = async () => {
            if (user) {
                try {
                    // Делаем запрос к API.
                    // Предполагается, что на бэке есть роут GET /notifications/
                    // Если вы используете generic database read, путь может отличаться
                    const response = await privateApi.get('/notifications/');

                    // Маппим данные с бэка в формат фронтенда
                    const mappedNotifications = response.data.map(n => ({
                        id: n.id,
                        text: n.message || 'Без текста', // Поле message из Python модели Notification
                        time: formatRelativeTime(n.created_at || n.date), // created_at или date
                        read: n.is_read || false // Поле is_read (если есть)
                    }));

                    // Сортируем: новые сверху
                    setNotifications(mappedNotifications.reverse());
                } catch (error) {
                    console.error("Ошибка получения уведомлений:", error);
                    // Можно оставить пустой массив или показать ошибку
                }
            } else {
                setNotifications([]);
            }
        };

        fetchNotifications();

        // Опционально: можно поставить интервал для опроса новых уведомлений
        // const interval = setInterval(fetchNotifications, 60000);
        // return () => clearInterval(interval);
    }, [user]);

    // Обновление статуса прочтения
    const toggleReadStatus = async (id) => {
        // Оптимистичное обновление UI (сразу меняем вид, не дожидаясь бэка)
        setNotifications(notifications.map(not =>
            not.id === id ? { ...not, read: !not.read } : not
        ));

        // Отправка запроса на бэк (если бэк поддерживает обновление статуса)
        if (user) {
            try {
                await privateApi.post('/notifications/read', { id });
            } catch (error) {
                console.error("Не удалось обновить статус уведомления", error);
            }
        }
    };

    // --- КОНЕЦ ЛОГИКИ УВЕДОМЛЕНИЙ ---

    useEffect(() => {
        if (isMapPage) {
            const times = getFilteredTimes(userType);
            setAvailableTimes(times);

            if (times.length > 0 && !selectedTime) {
                setSelectedTime(times[0].value);
            }
        }
    }, [userType, isMapPage, selectedTime]);

    const toggleNotifications = () => setShowNotifications(!showNotifications);

    const goToProfileOrLogin = () => {
        if (user) {
            navigate('/profile');
        } else {
            navigate('/login');
        }
    };

    const handleRulesClick = () => {
        setIsRulesModalOpen(true);
    };

    const closeRulesModal = () => {
        setIsRulesModalOpen(false);
    };

    const handleTimeRangeClick = () => {
        setIsTimeRangeModalOpen(true);
    };


    const handleTimeRangeSelect = (timeRange) => {
        const isValidTime = availableTimes.some(time => time.value === timeRange);
        if (isValidTime) {
            setSelectedTime(timeRange);
        } else {
            console.warn('Выбранное время недоступно для вашего типа пользователя');
            if (availableTimes.length > 0) {
                setSelectedTime(availableTimes[0].value);
            }
        }
        setIsTimeRangeModalOpen(false);
    };

    const getTimeInfoText = () => {
        if (availableTimes.length === 0) {
            return userType === 'external'
                ? 'Для внешних пользователей: 8:00-17:00 (Пн-Сб)'
                : 'Бронирование недоступно (воскресенье)';
        }

        const firstTime = availableTimes[0];
        const lastTime = availableTimes[availableTimes.length - 1];
        return `Доступно: ${firstTime.start} - ${lastTime.end}`;
    };

    const closeTimeRangeModal = () => {
        setIsTimeRangeModalOpen(false);
    };

    const handleSeatsChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            updateFilter('minCapacity', value === '' ? 0 : parseInt(value));
        }
    };

    const handleFloorChange = (e) => {
        updateFilter('floor', e.target.value);
    };

    const handleCorpusChange = (e) => {
        updateFilter('corpus', e.target.value);
    };

    // Подсчет непрочитанных уведомлений для бейджика (красная точка)
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
                        {/* Отображаем колокольчик только для авторизованных пользователей */}
                        {user && (
                            <div className="notification-dropdown">
                                <button className="icon-btn" onClick={toggleNotifications} style={{position: 'relative'}}>
                                    <BellIcon />
                                    {/* Красная точка, если есть непрочитанные */}
                                    {unreadCount > 0 && (
                                        <span className="notification-badge" style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: 'red',
                                            borderRadius: '50%'
                                        }}></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="notification-menu">
                                        <div className="notification-header">
                                            <h3>Уведомления</h3>
                                            <button className="close-btn" onClick={() => setShowNotifications(false)}>×</button>
                                        </div>
                                        <ul className="notification-list">
                                            {notifications.length === 0 ? (
                                                <li className="notification-item" style={{justifyContent: 'center', color: '#888'}}>
                                                    Нет новых уведомлений
                                                </li>
                                            ) : (
                                                notifications.map((not) => (
                                                    <li key={not.id} className={`notification-item ${not.read ? 'read' : ''}`}>
                                                        <div className="notification-content">
                                                            <p>{not.text}</p>
                                                            <span className="notification-time">{not.time}</span>
                                                        </div>
                                                        <button
                                                            className={`read-button ${not.read ? 'read' : ''}`}
                                                            onClick={() => toggleReadStatus(not.id)}
                                                            aria-label={not.read ? 'Отметить как непрочитанное' : 'Отметить как прочитанное'}
                                                        >
                                                            <CheckIcon />
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <button className="icon-btn" onClick={goToProfileOrLogin}>
                            <ProfileIcon />
                        </button>
                    </div>
                </div>

                {/* Дополнительный ряд - показывается только на карте */}
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
                                    <option value="seminar">Семинарская</option>
                                    <option value="lab">Лаборатория</option>
                                    <option value="reading">Читальный зал</option>
                                </select>
                            </div>

                            <div className="auditoriums-section">
                                <label className="auditoriums-label">Аудитории</label>
                                <div className="auditoriums-stats single-stat">
                                    <span className="stat-item">
                                        Найдено: <strong>{roomStats.found}</strong> из {roomStats.total}
                                    </span>
                                </div>
                            </div>

                            <div className="filter-with-label time-filter">
                                <label className="filter-label">Время</label>
                                <div className="time-select-wrapper">
                                    <button
                                        className="time-range-btn"
                                        onClick={handleTimeRangeClick}
                                        disabled={availableTimes.length === 0}
                                    >
                                        {selectedTime || 'Выбрать время'}
                                    </button>
                                    {availableTimes.length > 0 && (
                                        <div className="time-info-tooltip">
                                            {getTimeInfoText()}
                                        </div>
                                    )}
                                    {availableTimes.length === 0 && (
                                        <div className="time-unavailable">
                                            {getTimeInfoText()}
                                        </div>
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
                                />
                            </div>


                            <button className="icon-btn" onClick={handleRulesClick}>
                                <HelpIcon />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {isRulesModalOpen && (
                <RulesModal onClose={closeRulesModal} />
            )}

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