import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import BookingDetailsModal from '../components/modals/BookingDetailsModal.jsx';
import AdminCharts from '../components/charts/AdminCharts.jsx';
import { privateApi } from '../utils/api/axios';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Данные
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Статистика
    const [statistics, setStatistics] = useState({
        totalUsers: 0, activeUsers: 0, pendingUsers: 0, blockedUsers: 0,
        totalBookings: 0, pendingModeration: 0, approvedBookings: 0, rejectedBookings: 0,
        totalRevenue: 0,
        roomsAvailable: 0, occupiedRooms: 0, popularRoom: '-'
    });

    // Хардкодные данные для графиков (оставляем для красоты, пока не реализуете сбор данных для графиков)
    const mockChartData = {
        users: users,
        bookings: bookings,
        revenueData: [
            { name: 'Янв', value: 4000 }, { name: 'Фев', value: 3000 },
            { name: 'Мар', value: 2000 }, { name: 'Апр', value: 2780 },
            { name: 'Май', value: 1890 }, { name: 'Июн', value: 2390 },
        ],
        statusDistribution: [
            { name: 'Подтверждено', value: bookings.filter(b => b.status === true).length },
            { name: 'Отклонено', value: bookings.filter(b => b.status === false).length },
            { name: 'На проверке', value: bookings.filter(b => b.status === null).length },
        ]
    };

    // --- ЗАГРУЗКА ДАННЫХ ---
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            switch (activeTab) {
                case 'stats':
                    await fetchStatistics();
                    break;
                case 'users':
                    await fetchUsers();
                    break;
                case 'bookings':
                case 'moderation':
                    await fetchBookings();
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error(err);
            setError('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    // --- ИСПРАВЛЕННАЯ ЛОГИКА СТАТИСТИКИ (СЧИТАЕМ НА ФРОНТЕ) ---
    const fetchStatistics = async () => {
        try {
            // 1. Получаем все необходимые данные параллельно
            const [usersRes, bookingsRes, classroomsRes] = await Promise.all([
                privateApi.post('/database/get/User', {}),
                privateApi.post('/database/get/Booking', {}),
                privateApi.post('/database/get/Classroom', {})
            ]);

            // 2. Безопасно извлекаем массивы (даже если API вернет один объект или null)
            const ensureArray = (data) => {
                if (!data) return [];
                return Array.isArray(data) ? data : [data];
            };

            const usersData = ensureArray(usersRes.data);
            const bookingsData = ensureArray(bookingsRes.data);
            const classroomsData = ensureArray(classroomsRes.data);

            // 3. --- СЧИТАЕМ СТАТИСТИКУ ПОЛЬЗОВАТЕЛЕЙ ---
            const totalUsers = usersData.length;
            const activeUsers = usersData.filter(u => u.confirmed === true).length;
            const pendingUsers = usersData.filter(u => u.confirmed === false).length;
            const blockedUsers = 0; // Нет поля

            // 4. --- СЧИТАЕМ СТАТИСТИКУ БРОНИРОВАНИЙ И ФИНАНСОВ ---
            let totalRevenue = 0;
            let pendingModeration = 0;
            let approvedBookings = 0;
            let rejectedBookings = 0;
            const roomUsageCount = {}; // { classroom_id: count }

            bookingsData.forEach(booking => {
                // Статусы
                if (booking.status === null) pendingModeration++;
                else if (booking.status === true) {
                    approvedBookings++;
                    // Считаем выручку только по подтвержденным броням
                    // В json приходит total_cost как число или строка
                    totalRevenue += Number(booking.total_cost || 0);

                    // Считаем популярность аудитории
                    const roomId = booking.classroom_id;
                    roomUsageCount[roomId] = (roomUsageCount[roomId] || 0) + 1;
                }
                else if (booking.status === false) rejectedBookings++;
            });

            // 5. --- НАХОДИМ ПОПУЛЯРНУЮ АУДИТОРИЮ ---
            let popularRoomId = null;
            let maxCount = 0;
            for (const [roomId, count] of Object.entries(roomUsageCount)) {
                if (count > maxCount) {
                    maxCount = count;
                    popularRoomId = roomId;
                }
            }

            // Находим название аудитории по ID
            let popularRoomName = '-';
            if (popularRoomId) {
                const room = classroomsData.find(r => String(r.id) === String(popularRoomId));
                popularRoomName = room ? room.number : `ID: ${popularRoomId}`;
            }

            // 6. Обновляем стейт
            setStatistics({
                totalUsers,
                activeUsers,
                pendingUsers,
                blockedUsers,

                totalBookings: bookingsData.length,
                pendingModeration,
                approvedBookings,
                rejectedBookings,

                totalRevenue: totalRevenue, // Теперь считается корректно
                roomsAvailable: classroomsData.length,
                occupiedRooms: 0,
                popularRoom: popularRoomName
            });

            // Сохраняем данные для графиков
            setUsers(usersData);
            setBookings(bookingsData);

        } catch (err) {
            console.error("Ошибка при расчете статистики:", err);
            setError("Не удалось загрузить статистику");
        }
    };

    // --- API: ПОЛЬЗОВАТЕЛИ ---
    const fetchUsers = async () => {
        try {
            const response = await privateApi.post('/database/get/User', {});
            const data = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
            data.sort((a, b) => a.id - b.id);
            setUsers(data);
        } catch (err) {
            console.error("Ошибка получения пользователей:", err);
            setError("Не удалось загрузить пользователей");
        }
    };

    const handleUserAction = async (userId, action) => {
        setLoading(true);
        try {
            const newConfirmedStatus = action === 'confirm';
            await privateApi.post('/database/update/User', {
                id: userId,
                confirmed: newConfirmedStatus
            });
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, confirmed: newConfirmedStatus } : user
            ));
            // Если мы на вкладке статистики, можно перезапросить статы
            if (activeTab === 'stats') fetchStatistics();
        } catch (err) {
            console.error(err);
            setError(`Ошибка при изменении статуса: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- API: БРОНИРОВАНИЯ ---
    const fetchBookings = async () => {
        try {
            const bookingsRes = await privateApi.post('/database/get/Booking', {});
            const rawBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data ? [bookingsRes.data] : []);

            const [usersRes, roomsRes] = await Promise.all([
                privateApi.post('/database/get/User', {}),
                privateApi.post('/database/get/Classroom', {})
            ]);

            const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data ? [usersRes.data] : []);
            const allRooms = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data ? [roomsRes.data] : []);

            const usersMap = {};
            allUsers.forEach(u => usersMap[u.id] = u.email);

            const roomsMap = {};
            allRooms.forEach(r => roomsMap[r.id] = r.number);

            const enrichedBookings = rawBookings.map(b => {
                const startDate = new Date(b.date_start);
                const endDate = new Date(b.date_end);

                let statusStr = 'pending';
                if (b.status === true) statusStr = 'approved';
                if (b.status === false) statusStr = 'rejected';

                return {
                    id: b.id,
                    userEmail: usersMap[b.user_id] || `ID: ${b.user_id}`,
                    room: roomsMap[b.classroom_id] ? `Ауд. ${roomsMap[b.classroom_id]}` : `ID: ${b.classroom_id}`,
                    date: startDate.toLocaleDateString('ru-RU'),
                    startTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    endTime: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: statusStr,
                    rawStatus: b.status,
                    description: b.description || 'Нет описания',
                    equipment: []
                };
            });

            enrichedBookings.sort((a, b) => b.id - a.id);
            setBookings(enrichedBookings);

        } catch (err) {
            console.error("Ошибка получения бронирований:", err);
            setError("Не удалось загрузить бронирования");
        }
    };

    const handleBookingAction = async (bookingId, action) => {
        setLoading(true);
        try {
            const isApprove = action === 'approve';
            const commentText = isApprove ? "Ваша заявка одобрена." : "Заявка отклонена администратором.";

            await privateApi.post('/booking/update', {
                id: bookingId,
                status: isApprove,
                comment: commentText
            });

            const statusStr = isApprove ? 'approved' : 'rejected';
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: statusStr, rawStatus: isApprove } : b
            ));

            // Если мы в статистике - обновляем цифры
            if (activeTab === 'stats') fetchStatistics();

        } catch (err) {
            console.error(err);
            setError(`Ошибка при изменении статуса: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- UI HELPERS ---
    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedBooking(null);
    };

    const handleApproveBooking = async (bookingId) => {
        await handleBookingAction(bookingId, 'approve');
        handleCloseBookingModal();
    };

    const handleRejectBooking = async (bookingId) => {
        await handleBookingAction(bookingId, 'reject');
        handleCloseBookingModal();
    };

    const handleBulkAction = (action) => alert("В разработке");
    const handleUserSelect = (id) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleSelectAll = () => setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id));

    const getStatusBadge = (status) => {
        const map = {
            active: 'Активен', pending: 'На проверке', blocked: 'Заблокирован',
            approved: 'Подтверждено', rejected: 'Отклонено'
        };
        const cls = `status-${status}`;
        return <span className={`status-badge ${cls}`}>{map[status] || status}</span>;
    };

    const getConfirmationBadge = (isConfirmed) => isConfirmed
        ? <span className="status-badge status-approved">Подтвержден</span>
        : <span className="status-badge status-pending" style={{ background: '#e9ecef', color: '#495057' }}>Нет</span>;

    const getRoleText = (r) => ({ user: 'Пользователь', kgu: 'Сотрудник/Студент', admin: 'Администратор' }[r] || r);
    const formatBookingTime = (b) => (b.startTime && b.endTime) ? `${b.startTime} - ${b.endTime}` : '-';

    // --- RENDER ---

    if (loading && bookings.length === 0 && users.length === 0 && activeTab !== 'stats') {
        return <div className="admin-page"><div className="admin-container"><div className="loading-state"><div className="loading-spinner"></div><p>Загрузка данных...</p></div></div></div>;
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <h2>Панель администратора</h2>
                    <p>Управление пользователями и бронированиями</p>
                </div>

                <div className="admin-tabs">
                    <button className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Статистика</button>
                    <button className={`tab-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Пользователи</button>
                    <button className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Бронирования</button>
                    <button className={`tab-button ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>Модерация</button>
                </div>

                {error && <div className="error-message" style={{ margin: '20px', color: 'red' }}>{error}</div>}

                <div className="admin-content">
                    {/* --- TAB: STATS --- */}
                    {activeTab === 'stats' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Общая статистика</h3>
                                <div className="table-actions">
                                    <button className="action-btn secondary" onClick={loadData}>Обновить</button>
                                </div>
                            </div>

                            {/* Карточки с РЕАЛЬНЫМИ данными */}
                            <div className="stats-container">
                                <div className="stats-grid-three">
                                    <div className="stat-card">
                                        <h4>Пользователи</h4>
                                        <div className="stat-number">{statistics.totalUsers}</div>
                                        <div className="stat-label">Всего пользователей</div>
                                        <div className="stat-details">
                                            <span>Подтверждено: {statistics.activeUsers}</span>
                                            <span>Не подтверждено: {statistics.pendingUsers}</span>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <h4>Бронирования</h4>
                                        <div className="stat-number">{statistics.totalBookings}</div>
                                        <div className="stat-label">Всего бронирований</div>
                                        <div className="stat-details">
                                            <span>Одобрено: {statistics.approvedBookings}</span>
                                            <span>На модерации: {statistics.pendingModeration}</span>
                                            <span>Выручка: {statistics.totalRevenue} ₽</span>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <h4>Аудитории</h4>
                                        <div className="stat-number">{statistics.roomsAvailable}</div>
                                        <div className="stat-label">Всего аудиторий</div>
                                        <div className="stat-details">
                                            <span>Топ по выручке: {statistics.popularRoom}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <AdminCharts
                                statistics={mockChartData}
                                bookings={bookings}
                                users={users}
                                revenueData={mockChartData.revenueData}
                            />
                        </div>
                    )}

                    {/* --- TAB: USERS --- */}
                    {activeTab === 'users' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Управление пользователями</h3>
                                <div className="table-actions">
                                    <button className="action-btn secondary" onClick={() => handleBulkAction('export')}>Экспорт</button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th><input type="checkbox" checked={selectedUsers.length === users.length && users.length > 0} onChange={handleSelectAll} /></th>
                                        <th>ID</th><th>Email</th><th>Роль</th><th>Подтверждение КГУ</th><th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleUserSelect(user.id)} /></td>
                                            <td className="cell-id">#{user.id}</td>
                                            <td className="cell-email">{user.email}</td>
                                            <td className="cell-role">{getRoleText(user.role)}</td>
                                            <td className="cell-status">{getConfirmationBadge(user.confirmed)}</td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    {user.confirmed ? (
                                                        <button className="btn-block" onClick={() => handleUserAction(user.id, 'revoke')}>Отменить</button>
                                                    ) : (
                                                        <button className="btn-approve" onClick={() => handleUserAction(user.id, 'confirm')}>Подтвердить</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: BOOKINGS --- */}
                    {activeTab === 'bookings' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Все бронирования</h3>
                                <div className="table-actions">
                                    <button className="action-btn secondary" onClick={loadData}>Обновить</button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th><th>Пользователь</th><th>Аудитория</th><th>Дата</th><th>Время</th><th>Статус</th><th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td className="cell-id">#{booking.id}</td>
                                            <td className="cell-user">{booking.userEmail}</td>
                                            <td className="cell-room">{booking.room}</td>
                                            <td className="cell-date">{booking.date}</td>
                                            <td className="cell-time">{formatBookingTime(booking)}</td>
                                            <td className="cell-status">{getStatusBadge(booking.status)}</td>
                                            <td className="cell-actions">
                                                <div className="action-buttons">
                                                    <button className="btn-view" onClick={() => handleViewBooking(booking)}>Просмотр</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: MODERATION --- */}
                    {activeTab === 'moderation' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Бронирования на модерации</h3>
                                <div className="moderation-stats">
                                    <span className="pending-count">Ожидают решения: {bookings.filter(b => b.status === 'pending').length}</span>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th><th>Пользователь</th><th>Аудитория</th><th>Дата</th><th>Время</th><th>Цель (Описание)</th><th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bookings.filter(b => b.status === 'pending').length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Нет заявок на модерации</td></tr>
                                    ) : (
                                        bookings.filter(booking => booking.status === 'pending').map(booking => (
                                            <tr key={booking.id}>
                                                <td className="cell-id">#{booking.id}</td>
                                                <td className="cell-user">{booking.userEmail}</td>
                                                <td className="cell-room">{booking.room}</td>
                                                <td className="cell-date">{booking.date}</td>
                                                <td className="cell-time">{formatBookingTime(booking)}</td>
                                                <td className="cell-equipment" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {booking.description}
                                                </td>
                                                <td className="cell-actions">
                                                    <div className="action-buttons">
                                                        <button className="btn-approve" onClick={() => handleBookingAction(booking.id, 'approve')}>Подтвердить</button>
                                                        <button className="btn-reject" onClick={() => handleBookingAction(booking.id, 'reject')}>Отклонить</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showBookingModal && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={handleCloseBookingModal}
                    onApprove={handleApproveBooking}
                    onReject={handleRejectBooking}
                />
            )}
        </div>
    );
};

export default AdminPage;