// src/pages/MapPage.jsx
import React, { useState } from 'react';
import InteractiveSVG from '../components/InteractiveSVG';
import RoomModal from '../components/modals/RoomModal';
import './MapPage.css';

// Импортируем SVG файлы
import Floor1_2D from '../assets/maps/1flor.svg';
import Floor2_2D from '../assets/maps/2flor.svg';
import Floor3_2D from '../assets/maps/3flor.svg';
import Floor4_2D from '../assets/maps/4flor.svg';

const MapPage = () => {
    const [mapMode, setMapMode] = useState('2d');
    const [currentFloor, setCurrentFloor] = useState(1);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const floorSVGs = {
        '2d': {
            1: Floor1_2D,
            2: Floor2_2D,
            3: Floor3_2D,
            4: Floor4_2D
        },
        '2.5d': {
            1: Floor1_2D,
            2: Floor2_2D,
            3: Floor3_2D,
            4: Floor4_2D
        }
    };

    // Функция для получения данных об аудитории с бэкенда
    const fetchRoomInfo = async (roomId) => {
        setLoading(true);
        setError(null);

        try {
            // Запрос к вашему бэкенду
            const response = await fetch(`/api/rooms/${roomId}`);

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            const data = await response.json();
            setRoomInfo(data);
            setIsRoomModalOpen(true);

        } catch (err) {
            console.error('Ошибка при загрузке данных:', err);
            setError('Не удалось загрузить информацию об аудитории');

            // Показываем модалку даже при ошибке, но с сообщением об ошибке
            setRoomInfo({
                id: roomId,
                name: `Аудитория ${roomId}`,
                type: 'Неизвестно',
                capacity: 0,
                equipment: [],
                status: 'неизвестно',
                description: 'Информация временно недоступна'
            });
            setIsRoomModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId) => {
        console.log('Клик по аудитории:', roomId);
        setSelectedRoom(roomId);

        // Запрашиваем данные с бэкенда
        fetchRoomInfo(roomId);
    };

    const handleBookRoom = async (roomId) => {
        try {
            setLoading(true);

            // Запрос на бронирование
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    date: new Date().toISOString().split('T')[0],
                    timeSlot: '10:00-11:30'
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Аудитория ${roomId} успешно забронирована!`);
                handleCloseModal();
            } else {
                throw new Error('Ошибка бронирования');
            }
        } catch (err) {
            console.error('Ошибка при бронировании:', err);
            alert('Произошла ошибка при бронировании. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsRoomModalOpen(false);
        setSelectedRoom(null);
        setRoomInfo(null);
        setError(null);
    };

    const currentSVG = floorSVGs[mapMode][currentFloor];

    return (
        <div className="map-page">
            <div className="map-controls">
                <div className="map-mode-controls">
                    <h3>Режим карты:</h3>
                    <div className="mode-buttons">
                        <button
                            className={`mode-btn ${mapMode === '2d' ? 'active' : ''}`}
                            onClick={() => setMapMode('2d')}
                        >
                            2D
                        </button>
                        <button
                            className={`mode-btn ${mapMode === '2.5d' ? 'active' : ''}`}
                            onClick={() => setMapMode('2.5d')}
                        >
                            2.5D
                        </button>
                    </div>
                </div>

                <div className="floor-controls">
                    <h3>Этаж:</h3>
                    <div className="floor-buttons">
                        {[1, 2, 3, 4].map(floor => (
                            <button
                                key={floor}
                                className={`floor-btn ${currentFloor === floor ? 'active' : ''}`}
                                onClick={() => setCurrentFloor(floor)}
                            >
                                {floor}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="map-status">
                    <div className="status-badge">
                        Этаж: {currentFloor} | Режим: {mapMode === '2d' ? '2D' : '2.5D'}
                        {selectedRoom && ` | Выбрана: ${selectedRoom}`}
                        {loading && ' | Загрузка...'}
                    </div>
                </div>
            </div>

            <div className="map-container">
                <div className="map-content">
                    <InteractiveSVG
                        svgUrl={currentSVG}
                        onRoomClick={handleRoomClick}
                        selectedRoom={selectedRoom}
                    />
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Загрузка информации...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно с данными из бэкенда */}
            <RoomModal
                roomInfo={roomInfo}
                isOpen={isRoomModalOpen}
                onClose={handleCloseModal}
                onBook={handleBookRoom}
                loading={loading}
                error={error}
            />
        </div>
    );
};

export default MapPage;