// src/components/Header.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import BellIcon from './icons/header/BellIcon';
import ProfileIcon from './icons/header/ProfileIcon';
import HelpIcon from './icons/header/HelpIcon';
import CheckIcon from './icons/header/CheckIcon';
import RulesModal from './modals/RulesModal.jsx';
import './Header.css';

const initialNotifications = [
    { id: 1, text: 'Аудитория 205 забронирована на 15:00', time: '10 мин назад', read: false },
    { id: 2, text: 'Новое расписание на следующую неделю', time: '1 час назад', read: false },
    { id: 3, text: 'Напоминание: встреча в 14:00', time: '2 часа назад', read: false },
];

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMapPage = location.pathname === '/map';

    const [corpus, setCorpus] = useState('Б');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

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
                            <select value={corpus} onChange={(e) => setCorpus(e.target.value)}>
                                <option>А</option>
                                <option>Б</option>
                                <option>В</option>
                            </select>
                            <div className="stats">
                                <span>Акт залы: 0</span>
                                <span>Лекционные: 2</span>
                                <span>Учебные: 5</span>
                            </div>

                            <input type="text" placeholder="Укажите время" />
                            <input type="text" placeholder="Кол-во мест" />

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
        </>
    );
};

export default Header;