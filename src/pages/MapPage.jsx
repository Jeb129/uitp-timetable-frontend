// src/pages/MapPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import InteractiveSVG from '../components/InteractiveSVG';
import ThreeDViewer from '../components/ThreeDViewer';
import RoomModal from '../components/modals/RoomModal';
import { useFilters } from '../contexts/FilterContext';
import './MapPage.css';

// Импортируем SVG файлы
import Floor1_2D from '../assets/maps/1floor.svg';
import Floor2_2D from '../assets/maps/2floor.svg';
import Floor3_2D from '../assets/maps/3floor.svg';
import Floor4_2D from '../assets/maps/4floor.svg';

// Хардкод-данные для тестирования
const getHardcodedRoomInfo = (roomId) => {
    const roomData = {
        '201': {
            id: '201', name: 'Аудитория 201', type: 'Лекционная',
            capacity: 50, equipment: ['Проектор', 'Экран', 'Маркерная доска', 'Wi-Fi'],
            status: 'свободна', area: '60 м²', floor: '2',
            description: 'Основная лекционная аудитория с современным оборудованием', panorama: '201.jpg'
        },
        '202': {
            id: '202', name: 'Аудитория 202', type: 'Компьютерный класс',
            capacity: 25, equipment: ['Компьютеры', 'Проектор', 'Интерактивная доска'],
            status: 'свободна', area: '45 м²', floor: '2',
            description: 'Компьютерный класс для практических занятий', panorama: '202.jpg'
        },
        '203': {
            id: '203', name: 'Аудитория 203', type: 'Семинарская',
            capacity: 30, equipment: ['Телевизор', 'Маркерная доска'],
            status: 'занята', area: '40 м²', floor: '2',
            description: 'Семинарская комната для групповых занятий', panorama: '203.jpg'
        },
        '301': {
            id: '301', name: 'Аудитория 301', type: 'Лаборатория',
            capacity: 20, equipment: ['Специальное оборудование', 'Вытяжной шкаф'],
            status: 'свободна', area: '55 м²', floor: '3',
            description: 'Химическая лаборатория', panorama: '301.jpg'
        },
        '302': {
            id: '302', name: 'Аудитория 302', type: 'Читальный зал',
            capacity: 40, equipment: ['Книжные стеллажи', 'Компьютеры', 'Принтер'],
            status: 'свободна', area: '70 м²', floor: '3',
            description: 'Читальный зал библиотеки', panorama: '302.jpg'
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

const getAllRoomsData = () => {
    const roomIds = ['201', '202', '203', '301', '302'];
    const rooms = {};
    roomIds.forEach(id => {
        rooms[id] = getHardcodedRoomInfo(id);
    });
    return rooms;
};

// Функция проверки теперь принимает filters как аргумент
const checkRoomFilters = (roomData, filters) => {
    if (!roomData) return false;

    // 1. Этаж (строгое сравнение строк)
    if (filters.floor && String(filters.floor) !== '' && String(roomData.floor) !== String(filters.floor)) {
        return false;
    }

    // 2. Вместимость (защита от пустых значений)
    const filterCap = parseInt(filters.minCapacity, 10);
    const roomCap = parseInt(roomData.capacity, 10);

    // Если фильтр задан (число > 0) и вместимость комнаты меньше фильтра -> скрываем
    if (!isNaN(filterCap) && filterCap > 0) {
        if (roomCap < filterCap) return false;
    }

    // 3. Статус
    if (filters.status && filters.status !== 'all') {
        const statusMap = { 'free': 'свободна', 'busy': 'занята' };
        if (roomData.status !== statusMap[filters.status]) return false;
    }

    // 4. Тип
    if (filters.roomType && filters.roomType !== 'all') {
        const typeMap = {
            'lecture': 'Лекционная', 'computer': 'Компьютерный класс',
            'seminar': 'Семинарская', 'lab': 'Лаборатория', 'reading': 'Читальный зал'
        };
        // Используем includes для частичного совпадения, если в данных есть опечатки
        if (roomData.type !== typeMap[filters.roomType]) return false;
    }
    return true;
};

const MapPage = () => {
    const [mapMode, setMapMode] = useState('2d');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { filters, updateFilter, updateStats } = useFilters();
    const [currentFloor, setCurrentFloor] = useState(Number(filters.floor) || 1);

    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(Number(filters.floor));
        }
    }, [filters.floor]);

    const floorSVGs = {
        '2d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D },
        '2.5d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D }
    };

    // Получаем отфильтрованные аудитории
    const getFilteredRooms = useMemo(() => {
        const allRooms = getAllRoomsData();
        const filteredIds = [];

        Object.keys(allRooms).forEach(roomId => {
            if (checkRoomFilters(allRooms[roomId], filters)) {
                filteredIds.push(roomId);
            }
        });

        return filteredIds;
    }, [filters]);

    // Обновляем статистику для Хедера
    useEffect(() => {
        const allRooms = getAllRoomsData();
        const roomsArray = Object.values(allRooms);

        const targetFloor = filters.floor ? filters.floor.toString() : '1';
        const totalOnFloor = roomsArray.filter(r => r.floor === targetFloor).length;
        const foundCount = getFilteredRooms.length;

        updateStats(foundCount, totalOnFloor);
    }, [getFilteredRooms, filters.floor, updateStats]);

    // Обновляем фильтр этажа
    const handleFloorChange = (floor) => {
        setCurrentFloor(floor);
        updateFilter('floor', floor.toString());
    };

    // Загрузка данных аудитории
    const fetchRoomInfo = async (roomId) => {
        setLoading(true);
        setError(null);
        try {
            // Используем хардкод
            const hardcodedInfo = getHardcodedRoomInfo(roomId);
            setRoomInfo(hardcodedInfo);
            setIsRoomModalOpen(true);
        } catch (err) {
            console.error(err);
            setError('Ошибка при загрузке данных аудитории');
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
        // Логика бронирования
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

    const handleResetFilters = () => {
        updateFilter('floor', '');
        updateFilter('minCapacity', 0);
        updateFilter('roomType', 'all');
        updateFilter('status', 'all');
        setCurrentFloor(1);
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

                <div className="filter-stats">
                    <div className="stats-badge">
                        <span className="stats-text">
                            Показано: <strong>{getFilteredRooms.length}</strong>
                        </span>
                    </div>
                    {(filters.floor || filters.minCapacity > 0 || filters.roomType !== 'all' || filters.status !== 'all') && (
                        <button className="reset-filters-btn" onClick={handleResetFilters}>
                            Сбросить
                        </button>
                    )}
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
                    <InteractiveSVG
                        svgUrl={currentSVG}
                        onRoomClick={handleRoomClick}
                        selectedRoom={selectedRoom}
                        filteredRooms={getFilteredRooms}
                        currentFloor={currentFloor}
                    />
                    {/* Лоадеры и сообщения о пустых результатах */}
                </div>
            </div>

            {/* Модальное окно с данными - ДОБАВЛЕНО ОБРАТНО */}
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