// src/components/Header.jsx
import React, {useEffect, useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import BellIcon from './icons/header/BellIcon';
import ProfileIcon from './icons/header/ProfileIcon';
import HelpIcon from './icons/header/HelpIcon';
import CheckIcon from './icons/header/CheckIcon';
import RulesModal from './modals/RulesModal.jsx';
import TimeRangeModal from './modals/TimeRangeModal.jsx';
import './Header.css';

import { getFilteredTimes } from '../utils/rulesValidation.js';
import {useFilters} from "../contexts/FilterContext.jsx";

const initialNotifications = [
    { id: 1, text: 'Аудитория 205 забронирована на 15:00', time: '10 мин назад', read: false },
    { id: 2, text: 'Новое расписание на следующую неделю', time: '1 час назад', read: false },
    { id: 3, text: 'Напоминание: встреча в 14:00', time: '2 часа назад', read: false },
];

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
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isTimeRangeModalOpen, setIsTimeRangeModalOpen] = useState(false);

    useEffect(() => {
        if (isMapPage) {
            const times = getFilteredTimes(userType);
            setAvailableTimes(times);

            // Если есть доступные времена и ничего не выбрано, выбираем первый
            if (times.length > 0 && !selectedTime) {
                setSelectedTime(times[0].value);
            }
        }
    }, [userType, isMapPage, selectedTime]);

    const toggleNotifications = () => setShowNotifications(!showNotifications);

    const toggleReadStatus = (id) => {
        setNotifications(notifications.map(not =>
            not.id === id ? { ...not, read: !not.read } : not
        ));
    };

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
        // Проверяем, что выбранное время есть в списке доступных
        const isValidTime = availableTimes.some(time => time.value === timeRange);
        if (isValidTime) {
            setSelectedTime(timeRange);
        } else {
            console.warn('Выбранное время недоступно для вашего типа пользователя');
            // Выбираем первое доступное время
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
            // Обновляем глобальный фильтр
            updateFilter('minCapacity', value === '' ? 0 : parseInt(value));
        }
    };

    // Обработчик изменения этажа
    const handleFloorChange = (e) => {
        updateFilter('floor', e.target.value);
    };

    // Обработчик изменения корпуса
    const handleCorpusChange = (e) => {
        updateFilter('corpus', e.target.value);
    };

    return (
        <>
            <header className="header">
                {/* Основной ряд */}
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
                        <div className="notification-dropdown">
                            <button className="icon-btn" onClick={toggleNotifications}>
                                <BellIcon />
                            </button>

                            {showNotifications && (
                                <div className="notification-menu">
                                    <div className="notification-header">
                                        <h3>Уведомления</h3>
                                        <button className="close-btn" onClick={() => setShowNotifications(false)}>×</button>
                                    </div>
                                    <ul className="notification-list">
                                        {notifications.map((not) => (
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
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button className="icon-btn" onClick={goToProfileOrLogin}>
                            <ProfileIcon />
                        </button>
                    </div>
                </div>

                {/* Дополнительный ряд - показывается только на карте */}
                {isMapPage && (
                    <div className="header-secondary visible">
                        <div className="filter-group">
                            {/* Корпус с подписью */}
                            <div className="filter-with-label">
                                <label className="filter-label">Корпус</label>
                                <select
                                    value={filters.corpus || 'Б'} // Берем из контекста
                                    onChange={handleCorpusChange}
                                    className="corpus-select"
                                >
                                    <option value="А">А</option>
                                    <option value="Б">Б</option>
                                    <option value="В">В</option>
                                </select>
                            </div>

                            {/* Этаж с подписью */}
                            <div className="filter-with-label">
                                <label className="filter-label">Этаж</label>
                                <select
                                    value={filters.floor || '1'} // Берем из контекста
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

                            {/* Доступные аудитории с общим лейблом */}
                            <div className="auditoriums-section">
                                <label className="auditoriums-label">Аудитории</label>
                                <div className="auditoriums-stats single-stat">
                <span className="stat-item">
                    Найдено: <strong>{roomStats.found}</strong> из {roomStats.total}
                </span>
                                </div>
                            </div>

                            {/* Кнопка выбора времени с информацией */}
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

                            {/* Поле для количества мест */}
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

            {/* Модальное окно правил */}
            {isRulesModalOpen && (
                <RulesModal onClose={closeRulesModal} />
            )}

            {/* Модальное окно выбора временного интервала */}
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