// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Статические данные для демонстрации
    const [users, setUsers] = useState([
        { id: 1, email: 'user1@example.com', role: 'student', status: 'active' },
        { id: 2, email: 'user2@example.com', role: 'external', status: 'pending' },
        { id: 3, email: 'user3@example.com', role: 'employee', status: 'active' },
        { id: 4, email: 'user4@example.com', role: 'external', status: 'blocked' },
        { id: 5, email: 'user5@example.com', role: 'student', status: 'active' },
        { id: 6, email: 'user6@example.com', role: 'employee', status: 'active' },
    ]);

    const [bookings, setBookings] = useState([
        {
            id: 1,
            userEmail: 'user1@example.com',
            room: 'Аудитория 101',
            date: '2024-01-15',
            startTime: '10:00',
            endTime: '12:00',
            status: 'approved',
            equipment: ['Проектор', 'Микрофон', 'Экран']
        },
        {
            id: 2,
            userEmail: 'user2@example.com',
            room: 'Аудитория 205',
            date: '2024-01-16',
            startTime: '14:00',
            endTime: '15:30',
            status: 'pending',
            equipment: ['Интерактивная доска']
        },
        {
            id: 3,
            userEmail: 'user3@example.com',
            room: 'Конференц-зал',
            date: '2024-01-17',
            startTime: '16:00',
            endTime: '18:00',
            status: 'rejected',
            equipment: ['Проектор', 'Звуковая система']
        },
        {
            id: 4,
            userEmail: 'user4@example.com',
            room: 'Аудитория 301',
            date: '2024-01-18',
            startTime: '09:00',
            endTime: '10:30',
            status: 'pending',
            equipment: ['Ноутбук', 'Колонки']
        },
        {
            id: 5,
            userEmail: 'user5@example.com',
            room: 'Аудитория 102',
            date: '2024-01-19',
            startTime: '11:00',
            endTime: '13:00',
            status: 'pending',
            equipment: ['Проектор']
        },
    ]);

    const [statistics, setStatistics] = useState({
        totalUsers: 6,
        activeUsers: 4,
        pendingUsers: 1,
        blockedUsers: 1,
        totalBookings: 5,
        pendingModeration: 3,
        approvedBookings: 1,
        rejectedBookings: 1,
        roomsAvailable: 25,
        occupiedRooms: 12,
        popularRoom: 'Аудитория 101'
    });

    // Загрузка данных при монтировании и смене вкладок
    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Функция для загрузки данных (закомментирована для статических данных)
    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Имитация загрузки данных
            await new Promise(resolve => setTimeout(resolve, 500));

            // В реальном приложении здесь будут API вызовы:
            /*
            switch (activeTab) {
                case 'stats':
                    await loadStatistics();
                    break;
                case 'users':
                    await loadUsers();
                    break;
                case 'bookings':
                    await loadBookings();
                    break;
                case 'moderation':
                    await loadModerationBookings();
                    break;
                default:
                    break;
            }
            */

        } catch (err) {
            setError('Ошибка при загрузке данных');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Шаблоны API функций (закомментированы)
    /*
    const loadStatistics = async () => {
        const response = await fetch('/api/admin/statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load statistics');
        }

        const data = await response.json();
        setStatistics(data);
    };

    const loadUsers = async () => {
        const response = await fetch('/api/admin/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        setUsers(data);
    };

    const loadBookings = async () => {
        const response = await fetch('/api/admin/bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }

        const data = await response.json();
        setBookings(data);
    };

    const loadModerationBookings = async () => {
        const response = await fetch('/api/admin/bookings/pending', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load moderation bookings');
        }

        const data = await response.json();
        setBookings(data);
    };

    const handleUserAction = async (userId, action, data = {}) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} user`);
            }

            await loadUsers();

        } catch (err) {
            setError(`Ошибка при выполнении действия: ${err.message}`);
            console.error('Error performing user action:', err);
        }
    };

    const handleBookingAction = async (bookingId, action, data = {}) => {
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} booking`);
            }

            if (activeTab === 'moderation') {
                await loadModerationBookings();
            } else {
                await loadBookings();
            }

        } catch (err) {
            setError(`Ошибка при выполнении действия: ${err.message}`);
            console.error('Error performing booking action:', err);
        }
    };

    const handleBulkAction = async (action, data = {}) => {
        try {
            const response = await fetch(`/api/admin/bulk/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ids: selectedUsers,
                    ...data
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to perform bulk ${action}`);
            }

            await loadUsers();
            setSelectedUsers([]);

        } catch (err) {
            setError(`Ошибка при массовом действии: ${err.message}`);
            console.error('Error performing bulk action:', err);
        }
    };
    */

    // Заглушки для действий (для демонстрации)
    const handleUserAction = async (userId, action, data = {}) => {
        setLoading(true);
        try {
            // Имитация API вызова
            await new Promise(resolve => setTimeout(resolve, 500));

            if (action === 'block') {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, status: 'blocked' } : user
                ));
            } else if (action === 'unblock') {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, status: 'active' } : user
                ));
            }

        } catch (err) {
            setError(`Ошибка при выполнении действия: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBookingAction = async (bookingId, action, data = {}) => {
        setLoading(true);
        try {
            // Имитация API вызова
            await new Promise(resolve => setTimeout(resolve, 500));

            if (action === 'approve') {
                setBookings(bookings.map(booking =>
                    booking.id === bookingId ? { ...booking, status: 'approved' } : booking
                ));
            } else if (action === 'reject') {
                setBookings(bookings.map(booking =>
                    booking.id === bookingId ? { ...booking, status: 'rejected' } : booking
                ));
            }

        } catch (err) {
            setError(`Ошибка при выполнении действия: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async (action, data = {}) => {
        setLoading(true);
        try {
            // Имитация API вызова
            await new Promise(resolve => setTimeout(resolve, 500));

            if (action === 'export') {
                console.log('Экспорт выбранных пользователей:', selectedUsers);
                // В реальном приложении здесь будет логика экспорта
            }

            setSelectedUsers([]);

        } catch (err) {
            setError(`Ошибка при массовом действии: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(user => user.id));
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { class: 'status-active', text: 'Активен' },
            pending: { class: 'status-pending', text: 'На проверке' },
            blocked: { class: 'status-blocked', text: 'Заблокирован' },
            approved: { class: 'status-approved', text: 'Подтверждено' },
            rejected: { class: 'status-rejected', text: 'Отклонено' }
        };
        const statusInfo = statusMap[status] || { class: '', text: status };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
    };

    const getRoleText = (role) => {
        const roleMap = {
            student: 'Студент',
            employee: 'Сотрудник',
            external: 'Внешний пользователь',
            admin: 'Администратор'
        };
        return roleMap[role] || role;
    };

    // Функция для форматирования времени бронирования
    const formatBookingTime = (booking) => {
        if (booking.startTime && booking.endTime) {
            return `${booking.startTime} - ${booking.endTime}`;
        }
        return booking.time || 'Время не указано';
    };

    // Функция для получения email пользователя
    const getUserEmail = (booking) => {
        return booking.userEmail || booking.user || 'Email не указан';
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Загрузка данных...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <div className="error-state">
                        <p>{error}</p>
                        <button onClick={loadData} className="action-btn primary">
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <h2>Панель администратора</h2>
                    <p>Управление пользователями и бронированиями</p>
                </div>

                <div className="admin-tabs">
                    <button
                        className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Статистика
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Пользователи
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Бронирования
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'moderation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('moderation')}
                    >
                        Модерация
                    </button>
                </div>

                <div className="admin-content">
                    {activeTab === 'stats' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Общая статистика</h3>
                                <div className="table-actions">
                                    <button
                                        className="action-btn primary"
                                        onClick={() => alert('Функция экспорта в разработке')}
                                    >
                                        Экспорт отчета
                                    </button>
                                    <button
                                        className="action-btn secondary"
                                        onClick={loadData}
                                    >
                                        Обновить данные
                                    </button>
                                </div>
                            </div>
                            <div className="stats-container">
                                <div className="stats-grid-three">
                                    <div className="stat-card">
                                        <h4>Пользователи</h4>
                                        <div className="stat-number">{statistics.totalUsers}</div>
                                        <div className="stat-label">Всего пользователей</div>
                                        <div className="stat-details">
                                            <span>Активных: {statistics.activeUsers}</span>
                                            <span>На проверке: {statistics.pendingUsers}</span>
                                            <span>Заблокировано: {statistics.blockedUsers}</span>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <h4>Бронирования</h4>
                                        <div className="stat-number">{statistics.totalBookings}</div>
                                        <div className="stat-label">Всего бронирований</div>
                                        <div className="stat-details">
                                            <span>Подтверждено: {statistics.approvedBookings}</span>
                                            <span>На модерации: {statistics.pendingModeration}</span>
                                            <span>Отклонено: {statistics.rejectedBookings}</span>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <h4>Аудитории</h4>
                                        <div className="stat-number">{statistics.roomsAvailable}</div>
                                        <div className="stat-label">Доступно аудиторий</div>
                                        <div className="stat-details">
                                            <span>Занято сейчас: {statistics.occupiedRooms}</span>
                                            <span>Популярная: {statistics.popularRoom}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Управление пользователями</h3>
                                <div className="table-actions">
                                    <button
                                        className="action-btn primary"
                                        onClick={() => alert('Функция добавления пользователя в разработке')}
                                    >
                                        Добавить пользователя
                                    </button>
                                    <button
                                        className="action-btn secondary"
                                        disabled={selectedUsers.length === 0}
                                        onClick={() => handleBulkAction('export')}
                                    >
                                        Экспорт выбранных ({selectedUsers.length})
                                    </button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.length === users.length && users.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Роль</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleUserSelect(user.id)}
                                                />
                                            </td>
                                            <td className="cell-id">#{user.id}</td>
                                            <td className="cell-email">{user.email}</td>
                                            <td className="cell-role">{getRoleText(user.role)}</td>
                                            <td className="cell-status">{getStatusBadge(user.status)}</td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => alert('Редактирование пользователя в разработке')}
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        className="btn-block"
                                                        onClick={() => handleUserAction(
                                                            user.id,
                                                            user.status === 'blocked' ? 'unblock' : 'block'
                                                        )}
                                                    >
                                                        {user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Все бронирования</h3>
                                <div className="table-actions">
                                    <button className="action-btn primary">Фильтры</button>
                                    <button className="action-btn secondary">Экспорт всех</button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Пользователь</th>
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
                                            <td className="cell-id">#{booking.id}</td>
                                            <td className="cell-user">{getUserEmail(booking)}</td>
                                            <td className="cell-room">{booking.room}</td>
                                            <td className="cell-date">{booking.date}</td>
                                            <td className="cell-time">{formatBookingTime(booking)}</td>
                                            <td className="cell-status">{getStatusBadge(booking.status)}</td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    <button className="btn-view">Просмотр</button>
                                                    <button className="btn-edit">Изменить</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'moderation' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Бронирования на модерации</h3>
                                <div className="moderation-stats">
                                    <span className="pending-count">
                                        Ожидают решения: {bookings.filter(b => b.status === 'pending').length}
                                    </span>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Пользователь</th>
                                        <th>Аудитория</th>
                                        <th>Дата</th>
                                        <th>Время</th>
                                        <th>Оборудование</th>
                                        <th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bookings.filter(booking => booking.status === 'pending').map(booking => (
                                        <tr key={booking.id}>
                                            <td className="cell-id">#{booking.id}</td>
                                            <td className="cell-user">{getUserEmail(booking)}</td>
                                            <td className="cell-room">{booking.room}</td>
                                            <td className="cell-date">{booking.date}</td>
                                            <td className="cell-time">{formatBookingTime(booking)}</td>
                                            <td className="cell-equipment">
                                                {booking.equipment ? booking.equipment.join(', ') : 'Оборудование не указано'}
                                            </td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() => handleBookingAction(booking.id, 'approve')}
                                                    >
                                                        Подтвердить
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => handleBookingAction(booking.id, 'reject')}
                                                    >
                                                        Отклонить
                                                    </button>
                                                    <button className="btn-details">Подробнее</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;