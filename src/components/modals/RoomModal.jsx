// src/components/modals/RoomModal.jsx
import React, { useState } from 'react';
import CylindricalPanorama from '../CylindricalPanorama';
import TimeRangeModal from './TimeRangeModal';
import { useFilters } from '../../contexts/FilterContext';
import './RoomModal.css';

const RoomModal = ({ roomInfo, isOpen, onClose, onBook, loading, error }) => {
    const [showPanorama, setShowPanorama] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Подключаемся к глобальному фильтру
    const { filters, updateFilter } = useFilters();

    if (!isOpen) return null;

    const handlePanoramaClick = () => {
        setShowPanorama(true);
    };

    const handleClosePanorama = () => {
        setShowPanorama(false);
    };

    // При выборе времени обновляем глобальный контекст
    const handleTimeSelect = (timeRange) => {
        updateFilter('time', timeRange);
        setShowTimePicker(false);
    };

    const hasPanorama = roomInfo && roomInfo.panorama;

    // Блокируем кнопку, если время не выбрано
    const isBookDisabled = !roomInfo ||
        roomInfo.status !== 'свободна' ||
        loading ||
        !filters.time;

    return (
        <>
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

                                    {/* --- Блок выбора времени --- */}
                                    <div className="detail-row time-selection-section" style={{
                                        marginTop: '15px',
                                        borderTop: '1px solid #eee',
                                        paddingTop: '15px'
                                    }}>
                                        <span className="label">Время бронирования:</span>
                                        <div className="value" style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                                            {filters.time ? (
                                                <span style={{fontWeight: 'bold', color: '#0056b3', fontSize: '1.1rem'}}>
                                                    {filters.time}
                                                </span>
                                            ) : (
                                                <span style={{color: '#d9534f', fontStyle: 'italic'}}>
                                                    Время не выбрано
                                                </span>
                                            )}

                                            <button
                                                className="btn-text"
                                                onClick={() => setShowTimePicker(true)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '0.9rem',
                                                    background: '#f8f9fa',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {filters.time ? 'Изменить' : 'Выбрать время'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {hasPanorama && (
                                    <div className="panorama-section">
                                        <button
                                            className="panorama-btn"
                                            onClick={handlePanoramaClick}
                                        >
                                            <span className="panorama-icon">🌐</span>
                                            <span>3D панорама 360°</span>
                                        </button>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    {/* ID передается в функцию бронирования, а время берется из контекста внутри MapPage */}
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => onBook(roomInfo.id)}
                                        disabled={isBookDisabled}
                                        title={!filters.time ? "Сначала выберите время" : ""}
                                        style={!filters.time ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
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

            {/* Модалка с панорамой */}
            {showPanorama && hasPanorama && (
                <CylindricalPanorama
                    imageUrl={roomInfo.panorama}
                    onClose={handleClosePanorama}
                />
            )}

            {/* Модалка выбора времени */}
            {showTimePicker && (
                <TimeRangeModal
                    onClose={() => setShowTimePicker(false)}
                    onSelect={handleTimeSelect}
                    selectedTime={filters.time}
                />
            )}
        </>
    );
};

export default RoomModal;