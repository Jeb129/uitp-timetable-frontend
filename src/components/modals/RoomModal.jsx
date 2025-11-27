// src/components/modals/RoomModal.jsx
import React from 'react';
import './RoomModal.css';

const RoomModal = ({ roomInfo, isOpen, onClose, onBook, loading, error }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="room-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Информация об аудитории</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Загрузка информации об аудитории...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <p>{error}</p>
                        </div>
                    ) : roomInfo ? (
                        <>
                            <div className="room-header">
                                <h3 className="room-title">{roomInfo.name || `Аудитория ${roomInfo.id}`}</h3>
                                <span className={`status-badge ${roomInfo.status || 'неизвестно'}`}>
                                    {roomInfo.status || 'неизвестно'}
                                </span>
                            </div>

                            <div className="room-details">
                                <div className="detail-row">
                                    <span className="label">Тип:</span>
                                    <span className="value">{roomInfo.type || 'Не указан'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Вместимость:</span>
                                    <span className="value">
                                        {roomInfo.capacity ? `${roomInfo.capacity} человек` : 'Не указана'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Оборудование:</span>
                                    <span className="value">
                                        {roomInfo.equipment && roomInfo.equipment.length > 0
                                            ? roomInfo.equipment.join(', ')
                                            : 'Базовое оборудование'
                                        }
                                    </span>
                                </div>
                                {roomInfo.description && (
                                    <div className="detail-row">
                                        <span className="label">Описание:</span>
                                        <span className="value">{roomInfo.description}</span>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => onBook(roomInfo.id)}
                                    disabled={roomInfo.status !== 'свободна' || loading}
                                >
                                    {loading ? 'Бронирование...' : 'Забронировать'}
                                </button>
                                <button className="btn btn-secondary" onClick={onClose}>
                                    Закрыть
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="error-state">
                            <p>Не удалось загрузить информацию об аудитории</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomModal;