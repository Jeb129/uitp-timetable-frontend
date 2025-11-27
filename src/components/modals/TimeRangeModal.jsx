import React, { useState, useRef } from 'react';
import './TimeRangeModal.css';

const TimeRangeModal = ({ onClose, onSelect, selectedTime }) => {
    const [startTime, setStartTime] = useState(8 * 60);
    const [endTime, setEndTime] = useState(9 * 60);
    const sliderRef = useRef(null);
    const dragState = useRef({ activeHandle: null, startX: 0, startTime: 0, endTime: 0 });

    const minInterval = 15;

    const minutesToTimeString = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const getPosition = (minutes) => {
        return ((minutes - 8 * 60) / (20 * 60 - 8 * 60)) * 100;
    };

    const getMinutesFromPosition = (clientX) => {
        if (!sliderRef.current) return 0;
        const slider = sliderRef.current;
        const rect = slider.getBoundingClientRect();
        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        return Math.round(8 * 60 + (percent / 100) * (20 * 60 - 8 * 60));
    };

    const handleMouseDown = (handleType, e) => {
        e.preventDefault();
        dragState.current = {
            activeHandle: handleType,
            startX: e.clientX,
            startTime: startTime,
            endTime: endTime
        };

        const handleMouseMove = (e) => {
            const { activeHandle, startX, startTime: dragStart, endTime: dragEnd } = dragState.current;
            if (!activeHandle) return;

            const deltaX = e.clientX - startX;
            const deltaMinutes = Math.round((deltaX / sliderRef.current.offsetWidth) * (20 * 60 - 8 * 60));

            if (activeHandle === 'start') {
                let newStartTime = dragStart + deltaMinutes;
                newStartTime = Math.max(8 * 60, Math.min(newStartTime, endTime - minInterval));
                newStartTime = Math.floor(newStartTime / 15) * 15;
                setStartTime(newStartTime);
            } else {
                let newEndTime = dragEnd + deltaMinutes;
                newEndTime = Math.max(startTime + minInterval, Math.min(newEndTime, 20 * 60));
                newEndTime = Math.ceil(newEndTime / 15) * 15;
                setEndTime(newEndTime);
            }
        };

        const handleMouseUp = () => {
            dragState.current.activeHandle = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleQuickSelect = (hours) => {
        setStartTime(8 * 60);
        setEndTime((8 + hours) * 60);
    };

    const handleApply = () => {
        const timeRange = `${minutesToTimeString(startTime)} - ${minutesToTimeString(endTime)}`;
        onSelect(timeRange);
    };

    const startPosition = getPosition(startTime);
    const endPosition = getPosition(endTime);

    return (
        <div className="time-range-modal-overlay" onClick={onClose}>
            <div className="time-range-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="time-range-modal-header">
                    <h2>Выберите временной интервал</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="time-range-modal-content">
                    <div className="quick-select-section">
                        <h3>Быстрый выбор:</h3>
                        <div className="quick-buttons">
                            <button onClick={() => handleQuickSelect(1)}>1 час</button>
                            <button onClick={() => handleQuickSelect(2)}>2 часа</button>
                            <button onClick={() => handleQuickSelect(3)}>3 часа</button>
                            <button onClick={() => handleQuickSelect(4)}>4 часа</button>
                        </div>
                    </div>

                    <div className="time-slider-section">
                        <h3>Выберите интервал:</h3>

                        <div className="time-scale">
                            {[8, 10, 12, 14, 16, 18, 20].map(hour => (
                                <div key={hour} className="time-marker">
                                    <span>{hour}:00</span>
                                </div>
                            ))}
                        </div>

                        <div className="time-slider" ref={sliderRef}>
                            <div className="slider-track"></div>
                            <div
                                className="slider-range"
                                style={{
                                    left: `${startPosition}%`,
                                    width: `${endPosition - startPosition}%`
                                }}
                            ></div>
                            <div
                                className="slider-handle start-handle"
                                style={{ left: `${startPosition}%` }}
                                onMouseDown={(e) => handleMouseDown('start', e)}
                            >
                                <div className="handle-tooltip">
                                    {minutesToTimeString(startTime)}
                                </div>
                            </div>
                            <div
                                className="slider-handle end-handle"
                                style={{ left: `${endPosition}%` }}
                                onMouseDown={(e) => handleMouseDown('end', e)}
                            >
                                <div className="handle-tooltip">
                                    {minutesToTimeString(endTime)}
                                </div>
                            </div>
                        </div>

                        <div className="min-interval-info">
                            Минимальный интервал: 15 минут
                        </div>
                    </div>

                    <div className="time-preview">
                        <h3>Выбранный интервал:</h3>
                        <div className="selected-time">
                            {minutesToTimeString(startTime)} - {minutesToTimeString(endTime)}
                        </div>
                        <div className="duration-info">
                            Продолжительность: {Math.floor((endTime - startTime) / 60)} ч {(endTime - startTime) % 60} мин
                        </div>
                    </div>
                </div>

                <div className="time-range-modal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Отмена
                    </button>
                    <button className="btn-apply" onClick={handleApply}>
                        Применить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeRangeModal;