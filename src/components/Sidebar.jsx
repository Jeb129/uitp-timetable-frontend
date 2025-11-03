
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import CalendarIcon from './icons/sidebar/CalendarIcon.jsx';
import MapIcon from './icons/sidebar/MapIcon.jsx';
import AuditoriumIcon from './icons/sidebar/AuditoriumIcon.jsx';
import ScheduleIcon from './icons/sidebar/ScheduleIcon.jsx';
import KGUIcon from './icons/sidebar/KGUIcon.jsx';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/calendar', icon: <CalendarIcon />, label: 'Календарь' },
        { path: '/map', icon: <MapIcon />, label: 'Карта' },
        { path: '/auditoriums', icon: <AuditoriumIcon />, label: 'Аудитория' },
        { path: '/schedule', icon: <ScheduleIcon />, label: 'Расписание' },
        { path: '/kgu', icon: <KGUIcon />, label: 'КГУ' },
    ];

    return (
        <aside className="sidebar">
            <div>
                <img src="/logo.png" alt="Логотип КГУ" className="logo"/>
            </div>
            <nav>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <span className="icon">{item.icon}</span>
                        <span className="label">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;