// src/pages/MapPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveSVG from '../components/InteractiveSVG';
import RoomModal from '../components/modals/RoomModal';
import { useFilters } from '../contexts/FilterContext';
import { useAuth } from '../contexts/AuthContext';
import { publicApi, privateApi } from '../utils/api/axios';
import './MapPage.css';

// Импортируем SVG файлы
import Floor1_2D from '../assets/maps/1floor.svg';
import Floor2_2D from '../assets/maps/2floor.svg';
import Floor3_2D from '../assets/maps/3floor.svg';
import Floor4_2D from '../assets/maps/4floor.svg';

const MapPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // UI стейты
    const [mapMode, setMapMode] = useState('2d');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // Данные аудитории
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Данные всех аудиторий (для фильтрации)
    const [allRoomsData, setAllRoomsData] = useState({});

    const { filters, updateFilter, updateStats } = useFilters();
    const [currentFloor, setCurrentFloor] = useState(Number(filters.floor) || 1);

    const floorSVGs = {
        '2d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D },
        '2.5d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D }
    };

    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(Number(filters.floor));
        }
    }, [filters.floor]);

    // Загрузка списка всех аудиторий для подсветки на карте
    useEffect(() => {
        const fetchAllRooms = async () => {
            try {

                const response = await publicApi.post('/database/get/Classroom', {});

                const roomsObj = {};
                if (Array.isArray(response.data)) {
                    response.data.forEach(room => {
                        const id = String(room.id || room.id);
                        roomsObj[id] = {
                            id: id,
                            capacity: room.capacity,
                            type: room.type,
                            status: 'free',
                            floor: room.floor
                        };
                    });
                    setAllRoomsData(roomsObj);
                }
            } catch (err) {
                console.error("Ошибка загрузки списка аудиторий:", err);
            }
        };
        fetchAllRooms();
    }, []);

    // 2. Логика фильтрации (без изменений)
    const checkRoomFilters = (roomData, currentFilters) => {
        if (!roomData) return false;

        if (currentFilters.floor && String(currentFilters.floor) !== '' && String(roomData.floor) !== String(currentFilters.floor)) {
            return false;
        }

        const filterCap = parseInt(currentFilters.minCapacity, 10);
        const roomCap = parseInt(roomData.capacity, 10);
        if (!isNaN(filterCap) && filterCap > 0) {
            if (roomCap < filterCap) return false;
        }

        if (currentFilters.roomType && currentFilters.roomType !== 'all') {
            if (roomData.type !== currentFilters.roomType) return false;
        }

        return true;
    };

    const getFilteredRooms = useMemo(() => {
        const filteredIds = [];
        Object.keys(allRoomsData).forEach(roomId => {
            if (checkRoomFilters(allRoomsData[roomId], filters)) {
                filteredIds.push(roomId);
            }
        });
        return filteredIds;
    }, [filters, allRoomsData]);

    useEffect(() => {
        const roomsArray = Object.values(allRoomsData);
        const targetFloor = filters.floor ? filters.floor.toString() : '1';
        const totalOnFloor = roomsArray.filter(r => String(r.floor) === targetFloor).length;
        const foundCount = getFilteredRooms.length;
        updateStats(foundCount, totalOnFloor);
    }, [getFilteredRooms, filters.floor, updateStats, allRoomsData]);

    const handleFloorChange = (floor) => {
        setCurrentFloor(floor);
        updateFilter('floor', floor.toString());
    };

    // --- ЗАПРОС ИНФОРМАЦИИ ОБ АУДИТОРИИ ---
    const fetchRoomInfo = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await publicApi.post('/database/get/Classroom', {
                id: id
            });

            const data = response.data;
            let room = null;

            // Обрабатываем ответ: может быть массив объектов или один объект
            if (Array.isArray(data) && data.length > 0) {
                room = data[0];
            } else if (data && !Array.isArray(data) && data.id) {
                room = data;
            }

            if (room) {
                // Парсим оборудование
                let equipmentList = ['Базовое оборудование'];
                if (room.equipment) {
                    if (Array.isArray(room.equipment)) {
                        equipmentList = room.equipment;
                    } else if (typeof room.equipment === 'string') {
                        equipmentList = room.equipment.split(',').map(item => item.trim());
                    }
                }

                setRoomInfo({
                    id: room.id,
                    name: `Аудитория ${room.id}`,
                    type: room.type || 'Учебная',
                    capacity: room.capacity || 0,
                    equipment: equipmentList,
                    status: 'свободна',
                    description: room.description || '',
                    panorama: room.panorama_url || null,
                    floor: room.floor
                });

                setIsRoomModalOpen(true);
            } else {
                setError(`Информация об аудитории ${id} не найдена в базе данных.`);
                setIsRoomModalOpen(true);
            }

        } catch (err) {
            console.error("Ошибка при получении данных аудитории:", err);
            setError('Не удалось загрузить данные. Проверьте соединение.');
            setIsRoomModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = (roomId) => {
        setSelectedRoom(roomId);
        fetchRoomInfo(roomId);
    };

    // --- ПАРСИНГ ВРЕМЕНИ ---
    const parseTimeRange = (timeRangeStr) => {
        if (!timeRangeStr) return null;
        try {
            const [startStr, endStr] = timeRangeStr.split(' - ');
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);

            const startTimeInMinutes = startH * 60 + startM;
            const endTimeInMinutes = endH * 60 + endM;
            const duration = endTimeInMinutes - startTimeInMinutes;

            return { startH, startM, duration };
        } catch (e) {
            console.error("Ошибка парсинга времени", e);
            return null;
        }
    };

    // --- БРОНИРОВАНИЕ ---
    const handleBookRoom = async (roomId) => {
        if (!user) {
            alert("Для бронирования необходимо авторизоваться");
            navigate('/login');
            return;
        }

        const selectedTimeStr = filters.time;

        if (!selectedTimeStr) {
            alert("Пожалуйста, выберите время бронирования в верхней панели (кнопка 'Время').");
            setIsRoomModalOpen(false);
            return;
        }

        const timeData = parseTimeRange(selectedTimeStr);
        if (!timeData || timeData.duration <= 0) {
            alert("Некорректный временной интервал.");
            return;
        }

        setLoading(true);
        try {
            const bookingDate = new Date();
            bookingDate.setHours(timeData.startH, timeData.startM, 0, 0);

            const now = new Date();
            if (bookingDate < now) {
                bookingDate.setDate(bookingDate.getDate() + 1);
            }

            const isoDate = bookingDate.toISOString().split('.')[0];

            await privateApi.post('/booking/create', {
                classroom_number: roomId,
                date: isoDate,
                duration: timeData.duration,
                user_id: user.id
            });

            const displayDate = bookingDate.toLocaleDateString();

            alert(`Заявка успешно создана!\nАудитория: ${roomId}\nДата: ${displayDate}\nВремя: ${selectedTimeStr}`);
            handleCloseModal();

        } catch (err) {
            console.error('Ошибка при бронировании:', err);
            let errMsg = 'Произошла ошибка при бронировании.';
            if (err.response && err.response.data && err.response.data.error) {
                errMsg += `\nДетали: ${err.response.data.error}`;
            }
            alert(errMsg);
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
        updateFilter('time', '');
        setCurrentFloor(1);
    };

    const currentSVG = floorSVGs[mapMode][currentFloor];

    return (
        <div className="map-page">
            <div className="map-controls">
                <div className="map-mode-controls">
                    <h3>Режим карты:</h3>
                    <div className="mode-buttons">
                        <button className={`mode-btn ${mapMode === '2d' ? 'active' : ''}`} onClick={() => setMapMode('2d')}>2D План</button>
                        <button className={`mode-btn ${mapMode === '2.5d' ? 'active' : ''}`} onClick={() => setMapMode('2.5d')}>3D Просмотр</button>
                    </div>
                </div>

                <div className="floor-controls">
                    <h3>Этаж:</h3>
                    <div className="floor-buttons">
                        {[1, 2, 3, 4].map(floor => (
                            <button key={floor} className={`floor-btn ${currentFloor === floor ? 'active' : ''}`} onClick={() => handleFloorChange(floor)}>{floor}</button>
                        ))}
                    </div>
                </div>

                <div className="quick-filters">
                    <h3>Быстрые фильтры:</h3>
                    <div className="quick-filter-buttons">
                        <button className={`quick-filter-btn ${filters.roomType === 'lecture' ? 'active' : ''}`} onClick={() => updateFilter('roomType', filters.roomType === 'lecture' ? 'all' : 'lecture')}>Лекционные</button>
                        <button className={`quick-filter-btn ${filters.roomType === 'computer' ? 'active' : ''}`} onClick={() => updateFilter('roomType', filters.roomType === 'computer' ? 'all' : 'computer')}>Компьютерные</button>
                        <button className={`quick-filter-btn ${filters.minCapacity === 30 ? 'active' : ''}`} onClick={() => updateFilter('minCapacity', filters.minCapacity === 30 ? 0 : 30)}>От 30 мест</button>
                    </div>
                </div>

                <div className="filter-stats">
                    <div className="stats-badge">
                        <span className="stats-text">Показано: <strong>{getFilteredRooms.length}</strong></span>
                    </div>
                    {(filters.floor || filters.minCapacity > 0 || filters.roomType !== 'all' || filters.status !== 'all') && (
                        <button className="reset-filters-btn" onClick={handleResetFilters}>Сбросить</button>
                    )}
                </div>

                <div className="map-status">
                    <div className="status-badge">
                        Этаж: {currentFloor} | Режим: {mapMode === '2d' ? '2D' : '3D'}
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
                </div>
            </div>

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