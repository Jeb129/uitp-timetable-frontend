// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import BookingDetailsModal from '../components/modals/BookingDetailsModal.jsx';
import AdminCharts from '../components/charts/AdminCharts.jsx';
import { privateApi } from '../utils/api/axios';

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Модальное окно просмотра деталей (существующее)
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // --- НОВОЕ: Стейты для модального окна отклонения ---
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectBookingId, setRejectBookingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

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

    // Хардкодные данные для графиков
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

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            switch (activeTab) {
                case 'stats': await fetchStatistics(); break;
                case 'users': await fetchUsers(); break;
                case 'bookings':
                case 'moderation': await fetchBookings(); break;
                default: break;
            }
        } catch (err) {
            console.error(err);
            setError('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const [usersRes, bookingsRes, classroomsRes] = await Promise.all([
                privateApi.post('/database/get/User', {}),
                privateApi.post('/database/get/Booking', {}),
                privateApi.post('/database/get/Classroom', {})
            ]);

            const ensureArray = (data) => (!data ? [] : Array.isArray(data) ? data : [data]);
            const usersData = ensureArray(usersRes.data);
            const bookingsData = ensureArray(bookingsRes.data);
            const classroomsData = ensureArray(classroomsRes.data);

            const totalUsers = usersData.length;
            const activeUsers = usersData.filter(u => u.confirmed === true).length;
            const pendingUsers = usersData.filter(u => u.confirmed === false).length;

            let totalRevenue = 0;
            let pendingModeration = 0;
            let approvedBookings = 0;
            let rejectedBookings = 0;
            const roomUsageCount = {};

            bookingsData.forEach(booking => {
                if (booking.status === null) pendingModeration++;
                else if (booking.status === true) {
                    approvedBookings++;
                    totalRevenue += Number(booking.total_cost || 0);
                    const roomId = booking.classroom_id;
                    roomUsageCount[roomId] = (roomUsageCount[roomId] || 0) + 1;
                }
                else if (booking.status === false) rejectedBookings++;
            });

            let popularRoomId = null;
            let maxCount = 0;
            for (const [roomId, count] of Object.entries(roomUsageCount)) {
                if (count > maxCount) { maxCount = count; popularRoomId = roomId; }
            }

            let popularRoomName = '-';
            if (popularRoomId) {
                const room = classroomsData.find(r => String(r.id) === String(popularRoomId));
                popularRoomName = room ? room.number : `ID: ${popularRoomId}`;
            }

            setStatistics({
                totalUsers, activeUsers, pendingUsers, blockedUsers: 0,
                totalBookings: bookingsData.length, pendingModeration, approvedBookings, rejectedBookings,
                totalRevenue, roomsAvailable: classroomsData.length, occupiedRooms: 0, popularRoom: popularRoomName
            });
            setUsers(usersData);
            setBookings(bookingsData);
        } catch (err) {
            console.error("Ошибка при расчете статистики:", err);
            setError("Не удалось загрузить статистику");
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await privateApi.post('/database/get/User', {});
            const data = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
            data.sort((a, b) => a.id - b.id);
            setUsers(data);
        } catch (err) {
            setError("Не удалось загрузить пользователей");
        }
    };

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
                    description: b.description || 'Нет описания'
                };
            });

            enrichedBookings.sort((a, b) => b.id - a.id);
            setBookings(enrichedBookings);
        } catch (err) {
            setError("Не удалось загрузить бронирования");
        }
    };

    // --- ЛОГИКА ИЗМЕНЕНИЯ СТАТУСА ---
    // Добавили аргумент customComment
    const handleBookingAction = async (bookingId, action, customComment = "") => {
        setLoading(true);
        try {
            const isApprove = action === 'approve';
            // Если есть кастомный комментарий (причина отказа), используем его
            const commentText = customComment || (isApprove ? "Ваша заявка одобрена." : "Заявка отклонена.");

            // Отправляем на бэк. Бэк ожидает: { id, status (bool), comment }
            await privateApi.post('/booking/update', {
                id: bookingId,
                status: isApprove,
                comment: commentText
            });

            const statusStr = isApprove ? 'approved' : 'rejected';
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: statusStr, rawStatus: isApprove } : b
            ));

            if (activeTab === 'stats') fetchStatistics();

        } catch (err) {
            console.error(err);
            // Даже если упала ошибка 500 (из-за бага на бэке), мы можем обновить UI оптимистично,
            // но лучше показать ошибку, если бэк не ответил.
            setError(`Ошибка при изменении статуса (возможно проблема на сервере)`);
        } finally {
            setLoading(false);
        }
    };

    // --- ФУНКЦИИ ДЛЯ МОДАЛКИ ОТКАЗА ---
    const openRejectModal = (bookingId) => {
        setRejectBookingId(bookingId);
        setRejectReason(''); // Сброс поля
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!rejectBookingId) return;
        const reason = rejectReason.trim() || "Причина не указана администратором";

        // Вызываем обновление с причиной
        await handleBookingAction(rejectBookingId, 'reject', reason);

        setShowRejectModal(false);
        setRejectBookingId(null);
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
        if (showBookingModal) handleCloseBookingModal();
    };

    const handleRejectBooking = (bookingId) => {
        // Если открыто окно деталей, закрываем его перед открытием модалки отказа
        if (showBookingModal) handleCloseBookingModal();
        openRejectModal(bookingId);
    };

    const getStatusBadge = (status) => {
        const map = { active: 'Активен', pending: 'На проверке', blocked: 'Заблокирован', approved: 'Подтверждено', rejected: 'Отклонено' };
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
                    {/* STATS */}
                    {activeTab === 'stats' && (
                        <div className="tab-panel">
                            <AdminCharts statistics={mockChartData} bookings={bookings} users={users} revenueData={mockChartData.revenueData}/>
                        </div>
                    )}

                    {/* USERS */}
                    {activeTab === 'users' && (
                        <div className="tab-panel">
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead><tr><th>ID</th><th>Email</th><th>Роль</th><th>Подтверждение КГУ</th></tr></thead>
                                    <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="cell-id">#{user.id}</td>
                                            <td className="cell-email">{user.email}</td>
                                            <td className="cell-role">{getRoleText(user.role)}</td>
                                            <td className="cell-status">{getConfirmationBadge(user.confirmed)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS */}
                    {activeTab === 'bookings' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Все бронирования</h3>
                                <button className="action-btn secondary" onClick={loadData}>Обновить</button>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr><th>ID</th><th>Пользователь</th><th>Аудитория</th><th>Дата</th><th>Время</th><th>Статус</th><th>Действия</th></tr>
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
                                                <button className="btn-view" onClick={() => handleViewBooking(booking)}>Просмотр</button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* MODERATION */}
                    {activeTab === 'moderation' && (
                        <div className="tab-panel">
                            <div className="table-header">
                                <h3>Бронирования на модерации</h3>
                                <span className="pending-count">Ожидают: {bookings.filter(b => b.status === 'pending').length}</span>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr><th>ID</th><th>Пользователь</th><th>Аудитория</th><th>Дата</th><th>Время</th><th>Описание</th><th>Действия</th></tr>
                                    </thead>
                                    <tbody>
                                    {bookings.filter(b => b.status === 'pending').length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Нет заявок</td></tr>
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
                                                        <button className="btn-approve" onClick={() => handleApproveBooking(booking.id)} title="Одобрить">✓</button>
                                                        {/* Кнопка отклонения теперь открывает модалку */}
                                                        <button className="btn-reject" onClick={() => openRejectModal(booking.id)} title="Отклонить">✗</button>
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

            {/* Модальное окно деталей */}
            {showBookingModal && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={handleCloseBookingModal}
                    onApprove={() => handleApproveBooking(selectedBooking.id)}
                    onReject={() => handleRejectBooking(selectedBooking.id)}
                />
            )}

            {/* НОВОЕ: Модальное окно отклонения с причиной */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-container reject-modal" onClick={e => e.stopPropagation()} style={{
                        background: 'white', width: '90%', maxWidth: '500px', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{color: "black", margin: 0 }}>Отклонение заявки #{rejectBookingId}</h3>
                            <button className="close-btn" onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="modal-content">
                            <label style={{ color:"black", display: 'block', marginBottom: '8px', fontWeight: '500' }}>Причина отклонения:</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Укажите причину (например: Аудитория занята, неверное время...)"
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowRejectModal(false)} style={{color: "black", padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>Отмена</button>
                            <button onClick={confirmReject} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer' }}>Отклонить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;