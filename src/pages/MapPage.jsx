// src/pages/MapPage.jsx
import React, { useState } from 'react';
import InteractiveSVG from '../components/InteractiveSVG';
import ThreeDViewer from '../components/ThreeDViewer';
import RoomModal from '../components/modals/RoomModal';
import './MapPage.css';

// Импортируем SVG файлы
import Floor1_2D from '../assets/maps/1floor.svg';
import Floor2_2D from '../assets/maps/2floor.svg';
import Floor3_2D from '../assets/maps/3floor.svg';
import Floor4_2D from '../assets/maps/4floor.svg';

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

    // Хардкод-данные для тестирования
    const getHardcodedRoomInfo = (roomId) => {
        const roomData = {
            '201': {
                id: '201',
                name: 'Аудитория 201',
                type: 'Лекционная',
                capacity: 50,
                equipment: ['Проектор', 'Экран', 'Маркерная доска', 'Wi-Fi'],
                status: 'свободна',
                area: '60 м²',
                floor: '2',
                description: 'Основная лекционная аудитория с современным оборудованием'
            },
            '202': {
                id: '202',
                name: 'Аудитория 202',
                type: 'Компьютерный класс',
                capacity: 25,
                equipment: ['Компьютеры', 'Проектор', 'Интерактивная доска'],
                status: 'свободна',
                area: '45 м²',
                floor: '2',
                description: 'Компьютерный класс для практических занятий'
            },
            '203': {
                id: '203',
                name: 'Аудитория 203',
                type: 'Семинарская',
                capacity: 30,
                equipment: ['Телевизор', 'Маркерная доска'],
                status: 'занята',
                area: '40 м²',
                floor: '2',
                description: 'Семинарская комната для групповых занятий'
            },
            '301': {
                id: '301',
                name: 'Аудитория 301',
                type: 'Лаборатория',
                capacity: 20,
                equipment: ['Специальное оборудование', 'Вытяжной шкаф'],
                status: 'свободна',
                area: '55 м²',
                floor: '3',
                description: 'Химическая лаборатория'
            },
            '302': {
                id: '302',
                name: 'Аудитория 302',
                type: 'Читальный зал',
                capacity: 40,
                equipment: ['Книжные стеллажи', 'Компьютеры', 'Принтер'],
                status: 'свободна',
                area: '70 м²',
                floor: '3',
                description: 'Читальный зал библиотеки'
            }
        };

        return roomData[roomId] || {
            id: roomId,
            name: `Аудитория ${roomId}`,
            type: 'Учебная',
            capacity: 35,
            equipment: ['Проектор', 'Доска'],
            status: 'свободна',
            area: '50 м²',
            floor: String(roomId).charAt(0) || '2',
            description: 'Стандартная учебная аудитория',
            panorama: `${roomId}.jpg` // Только имя файла, без пути
        };
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

            // Используем хардкод-данные для тестирования
            console.log('Используем хардкод-данные для аудитории:', roomId);
            const hardcodedInfo = getHardcodedRoomInfo(roomId);
            setRoomInfo(hardcodedInfo);
            setIsRoomModalOpen(true);

            // Показываем информационное сообщение в консоли
            console.info('Бэкенд недоступен, используются тестовые данные');

        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId) => {
        console.log('Клик по аудитории:', roomId);
        setSelectedRoom(roomId);

        // Запрашиваем данные с бэкенда (с fallback на хардкод)
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
                            2D План
                        </button>
                        <button
                            className={`mode-btn ${mapMode === '2.5d' ? 'active' : ''}`}
                            onClick={() => setMapMode('2.5d')}
                        >
                            3D Просмотр
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
                        Этаж: {currentFloor} | Режим: {mapMode === '2d' ? '2D План' : '3D Просмотр'}
                        {selectedRoom && ` | Выбрана: ${selectedRoom}`}
                        {loading && ' | Загрузка...'}
                    </div>
                </div>
            </div>

            <div className="map-container">
                <div className="map-content">
                    {mapMode === '2d' ? (
                        <InteractiveSVG
                            svgUrl={currentSVG}
                            onRoomClick={handleRoomClick}
                            selectedRoom={selectedRoom}
                        />
                    ) : (
                        <ThreeDViewer
                            floor={currentFloor}
                        />
                    )}

                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Загрузка информации...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно с данными */}
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