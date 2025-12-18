// src/components/Sidebar.jsx (или где он у вас лежит)
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import CalendarIcon from './icons/sidebar/CalendarIcon.jsx';
import MapIcon from './icons/sidebar/MapIcon.jsx';
import ScheduleIcon from './icons/sidebar/ScheduleIcon.jsx';
import KGUIcon from './icons/sidebar/KGUIcon.jsx';
import RulesIcon from './icons/sidebar/RulesIcon.jsx';
import AdminIcon from './icons/sidebar/AdminIcon.jsx';
import { useAuth } from '../contexts/AuthContext'; // 1. Импортируем хук
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    // 2. Достаем объект user из контекста
    const { user } = useAuth();
    // 3. Проверяем роль.
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { path: '/calendar', icon: <CalendarIcon />, label: 'Календарь' },
        { path: '/map', icon: <MapIcon />, label: 'Карта' },
        { path: '/schedule', icon: <ScheduleIcon />, label: 'Расписание' },
        { path: '/kgu', icon: <KGUIcon />, label: 'КГУ' },
        { path: '/rules', icon: <RulesIcon />, label: 'Правила' },
        // Кнопка появится только если isAdmin === true
        ...(isAdmin ? [{ path: '/admin', icon: <AdminIcon />, label: 'Администрирование' }] : [])
    ];

    return (
        <aside className="sidebar">
            <div>
                <img src="/src/assets/Logo.jpg" alt="Логотип" className="logo"/>
            </div>
            <nav>
                {menuItems.map((item) => {
                    const textLength = item.label.length;
                    let textClass = '';
                    if (textLength > 12) textClass = 'very-long-text';
                    else if (textLength > 8) textClass = 'long-text';

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className={`label ${textClass}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;