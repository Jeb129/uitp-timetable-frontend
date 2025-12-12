// src/pages/MapPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import InteractiveSVG from '../components/InteractiveSVG';
import RoomModal from '../components/modals/RoomModal';
import { useFilters } from '../contexts/FilterContext';
import './MapPage.css';

// Импортируем SVG файлы
import Floor1_2D from '../assets/maps/1flor.svg';
import Floor2_2D from '../assets/maps/2flor.svg';
import Floor3_2D from '../assets/maps/3flor.svg';
import Floor4_2D from '../assets/maps/4flor.svg';

const MapPage = () => {
    const [mapMode, setMapMode] = useState('2d');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Используем контекст фильтров
    const { filters, updateFilter, updateStats } = useFilters();
    const [currentFloor, setCurrentFloor] = useState(parseInt(filters.floor) || 1);
    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(parseInt(filters.floor));
        }
    }, [filters.floor]);

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
                description: 'Основная лекционная аудитория с современным оборудованием',
                panorama: '201.jpg'
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
                description: 'Компьютерный класс для практических занятий',
                panorama: '202.jpg'
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
                description: 'Семинарская комната для групповых занятий',
                panorama: '203.jpg'
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
                description: 'Химическая лаборатория',
                panorama: '301.jpg'
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
                description: 'Читальный зал библиотеки',
                panorama: '302.jpg'
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
            panorama: `${roomId}.jpg`
        };
    };

    // Функция для получения всех аудиторий
    const getAllRoomsData = () => {
        const roomIds = ['201', '202', '203', '301', '302'];
        const rooms = {};
        roomIds.forEach(id => {
            rooms[id] = getHardcodedRoomInfo(id);
        });
        return rooms;
    };

    // Функция проверки, проходит ли аудитория фильтры
    const checkRoomFilters = (roomData) => {
        if (!roomData) return false;

        // Этаж
        if (filters.floor && filters.floor !== '' && roomData.floor !== filters.floor.toString()) return false;
        // Вместимость
        if (roomData.capacity < filters.minCapacity) return false;
        // Статус
        if (filters.status && filters.status !== 'all') {
            const statusMap = { 'free': 'свободна', 'busy': 'занята' };
            if (roomData.status !== statusMap[filters.status]) return false;
        }
        // Тип
        if (filters.roomType && filters.roomType !== 'all') {
            const typeMap = {
                'lecture': 'Лекционная', 'computer': 'Компьютерный класс',
                'seminar': 'Семинарская', 'lab': 'Лаборатория', 'reading': 'Читальный зал'
            };
            if (roomData.type !== typeMap[filters.roomType]) return false;
        }
        return true;
    };

    // Получаем отфильтрованные аудитории
    const getFilteredRooms = useMemo(() => {
        const allRooms = getAllRoomsData();
        const filteredIds = [];

        Object.keys(allRooms).forEach(roomId => {
            if (checkRoomFilters(allRooms[roomId])) {
                filteredIds.push(roomId);
            }
        });
        return filteredIds;
    }, [filters]);

    // Синхронизируем этаж карты с фильтром этажа
    useEffect(() => {
        const allRooms = getAllRoomsData();
        const roomsArray = Object.values(allRooms);

        // 1. Считаем общее количество комнат НА ТЕКУЩЕМ ЭТАЖЕ
        // Используем currentFloor или filters.floor
        const targetFloor = filters.floor ? filters.floor.toString() : '1';
        const totalOnFloor = roomsArray.filter(r => r.floor === targetFloor).length;

        // 2. Считаем сколько найдено (это длина filteredIds)
        // Но getFilteredRooms уже содержит только те, что прошли ВСЕ фильтры (включая этаж)
        const foundCount = getFilteredRooms.length;

        // 3. Обновляем контекст
        updateStats(foundCount, totalOnFloor);

    }, [getFilteredRooms, filters.floor]);

    // Обновляем фильтр этажа при изменении этажа в карте
    const handleFloorChange = (floor) => {
        setCurrentFloor(floor);
        updateFilter('floor', floor.toString());
    };

    // Функция для получения данных об аудитории
    const fetchRoomInfo = async (roomId) => {
        setLoading(true);
        setError(null);

        try {
            // Пытаемся получить с бэкенда
            const response = await fetch(`/api/rooms/${roomId}`);
            if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

            const data = await response.json();
            setRoomInfo(data);
            setIsRoomModalOpen(true);
        } catch (err) {
            console.error('Ошибка при загрузке данных:', err);

            // Используем хардкод-данные
            console.log('Используем хардкод-данные для аудитории:', roomId);
            const hardcodedInfo = getHardcodedRoomInfo(roomId);
            setRoomInfo(hardcodedInfo);
            setIsRoomModalOpen(true);

            console.info('Бэкенд недоступен, используются тестовые данные');
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId) => {
        console.log('Клик по аудитории:', roomId);
        setSelectedRoom(roomId);
        fetchRoomInfo(roomId);
    };

    const handleBookRoom = async (roomId) => {
        try {
            setLoading(true);
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    date: new Date().toISOString().split('T')[0],
                    timeSlot: '10:00-11:30'
                })
            });

            if (response.ok) {
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

    // Функция сброса всех фильтров
    const handleResetFilters = () => {
        updateFilter('floor', '');
        updateFilter('minCapacity', 0);
        updateFilter('roomType', 'all');
        updateFilter('status', 'all');
        setCurrentFloor(1);
    };

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
                                onClick={() => handleFloorChange(floor)}
                            >
                                {floor}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Быстрые фильтры */}
                <div className="quick-filters">
                    <h3>Быстрые фильтры:</h3>
                    <div className="quick-filter-buttons">
                        <button
                            className={`quick-filter-btn ${filters.roomType === 'lecture' ? 'active' : ''}`}
                            onClick={() => updateFilter('roomType', filters.roomType === 'lecture' ? 'all' : 'lecture')}
                        >
                            Лекционные
                        </button>
                        <button
                            className={`quick-filter-btn ${filters.roomType === 'computer' ? 'active' : ''}`}
                            onClick={() => updateFilter('roomType', filters.roomType === 'computer' ? 'all' : 'computer')}
                        >
                            Компьютерные
                        </button>
                        <button
                            className={`quick-filter-btn ${filters.status === 'free' ? 'active' : ''}`}
                            onClick={() => updateFilter('status', filters.status === 'free' ? 'all' : 'free')}
                        >
                            Только свободные
                        </button>
                        <button
                            className={`quick-filter-btn ${filters.minCapacity === 30 ? 'active' : ''}`}
                            onClick={() => updateFilter('minCapacity', filters.minCapacity === 30 ? 0 : 30)}
                        >
                            От 30 мест
                        </button>
                    </div>
                </div>

                {/* Статистика фильтрации */}
                <div className="filter-stats">
                    <div className="stats-badge">
                        <span className="stats-text">
                            Показано: <strong>{getFilteredRooms.length}</strong> из 5 аудиторий
                        </span>
                        {(filters.floor && filters.floor !== '') && (
                            <span className="stats-info"> | Этаж: {filters.floor}</span>
                        )}
                        {filters.minCapacity > 0 && (
                            <span className="stats-info"> | От {filters.minCapacity} мест</span>
                        )}
                        {filters.roomType !== 'all' && (
                            <span className="stats-info"> | Тип: {filters.roomType}</span>
                        )}
                        {filters.status !== 'all' && (
                            <span className="stats-info"> | Статус: {filters.status}</span>
                        )}
                    </div>
                    {(filters.floor || filters.minCapacity > 0 || filters.roomType !== 'all' || filters.status !== 'all') && (
                        <button
                            className="reset-filters-btn"
                            onClick={handleResetFilters}
                            title="Сбросить все фильтры"
                        >
                            Сбросить фильтры
                        </button>
                    )}
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
                        filteredRooms={getFilteredRooms} // Передаем отфильтрованные аудитории
                        currentFloor={currentFloor}
                    />
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Загрузка информации...</div>
                        </div>
                    )}

                    {/* Подсказка по фильтрации */}
                    {getFilteredRooms.length === 0 && (
                        <div className="no-rooms-message">
                            <div className="no-rooms-content">
                                <h3>Аудитории не найдены</h3>
                                <p>Попробуйте изменить параметры фильтрации:</p>
                                <ul>
                                    <li>Выберите другой этаж</li>
                                    <li>Уменьшите количество мест</li>
                                    <li>Сбросьте фильтр по типу или статусу</li>
                                </ul>
                                <button
                                    className="reset-filters-btn-large"
                                    onClick={handleResetFilters}
                                >
                                    Сбросить все фильтры
                                </button>
                            </div>
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