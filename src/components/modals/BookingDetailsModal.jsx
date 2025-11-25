// src/components/BookingDetailsModal.jsx
import React from 'react';
import './BookingDetailsModal.css';

const BookingDetailsModal = ({ booking, onClose, onApprove, onReject }) => {
    if (!booking) return null;

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

    const formatBookingTime = (booking) => {
        if (booking.startTime && booking.endTime) {
            return `${booking.startTime} - ${booking.endTime}`;
        }
        return booking.time || 'Время не указано';
    };

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <h2 className="booking-modal-title">Детали бронирования</h2>
                    <button className="booking-modal-close" onClick={onClose}>×</button>
                </div>

                <div className="booking-modal-content">
                    {/* Основная информация */}
                    <div className="booking-section">
                        <h3>Основная информация</h3>
                        <div className="booking-details-grid">
                            <div className="detail-item">
                                <label>ID бронирования:</label>
                                <span className="detail-value">#{booking.id}</span>
                            </div>
                            <div className="detail-item">
                                <label>Пользователь:</label>
                                <span className="detail-value">{booking.userEmail || booking.user || 'Не указан'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Аудитория:</label>
                                <span className="detail-value room-name">{booking.room}</span>
                            </div>
                            <div className="detail-item">
                                <label>Дата:</label>
                                <span className="detail-value">{booking.date}</span>
                            </div>
                            <div className="detail-item">
                                <label>Время:</label>
                                <span className="detail-value">{formatBookingTime(booking)}</span>
                            </div>
                            <div className="detail-item">
                                <label>Статус:</label>
                                <span className="detail-value">{getStatusBadge(booking.status)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Оборудование */}
                    <div className="booking-section">
                        <h3>Запрошенное оборудование</h3>
                        <div className="equipment-list">
                            {booking.equipment && booking.equipment.length > 0 ? (
                                <ul>
                                    {booking.equipment.map((item, index) => (
                                        <li key={index} className="equipment-item">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-equipment">Оборудование не запрашивалось</p>
                            )}
                        </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="booking-section">
                        <h3>Дополнительная информация</h3>
                        <div className="additional-info">
                            <div className="info-item">
                                <label>Создано:</label>
                                <span>{booking.createdAt || '2024-01-15 09:30:00'}</span>
                            </div>
                            <div className="info-item">
                                <label>Обновлено:</label>
                                <span>{booking.updatedAt || '2024-01-15 09:30:00'}</span>
                            </div>
                            {booking.reason && (
                                <div className="info-item">
                                    <label>Причина бронирования:</label>
                                    <span>{booking.reason}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* История действий */}
                    <div className="booking-section">
                        <h3>История действий</h3>
                        <div className="action-history">
                            <div className="history-item">
                                <span className="history-date">2024-01-15 09:30:00</span>
                                <span className="history-action">Заявка создана</span>
                            </div>
                            {booking.status === 'approved' && (
                                <div className="history-item approved">
                                    <span className="history-date">2024-01-15 10:15:00</span>
                                    <span className="history-action">Заявка одобрена администратором</span>
                                </div>
                            )}
                            {booking.status === 'rejected' && (
                                <div className="history-item rejected">
                                    <span className="history-date">2024-01-15 10:15:00</span>
                                    <span className="history-action">Заявка отклонена администратором</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Кнопки действий */}
                {booking.status === 'pending' && (
                    <div className="booking-modal-actions">
                        <button
                            className="action-btn approve-btn"
                            onClick={() => onApprove(booking.id)}
                        >
                            Подтвердить бронирование
                        </button>
                        <button
                            className="action-btn reject-btn"
                            onClick={() => onReject(booking.id)}
                        >
                            Отклонить заявку
                        </button>
                    </div>
                )}

                {booking.status !== 'pending' && (
                    <div className="booking-modal-actions">
                        <button
                            className="action-btn secondary-btn"
                            onClick={onClose}
                        >
                            Закрыть
                        </button>
                    </div>
                )}
            </div>
        </div>

    );

};


export default BookingDetailsModal;