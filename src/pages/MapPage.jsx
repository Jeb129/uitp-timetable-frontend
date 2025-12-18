// src/pages/MapPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveSVG from '../components/InteractiveSVG';
import ThreeDViewer from "../components/ThreeDViewer.jsx";
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

    // Данные всех аудиторий
    const [allRoomsData, setAllRoomsData] = useState({});

    const { filters, updateFilter, updateStats } = useFilters();
    const [currentFloor, setCurrentFloor] = useState(Number(filters.floor) || 1);

    const floorSVGs = {
        '2d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D },
        '2.5d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D }
    };

    // Хелперы
    const getSvgIdFromDbNumber = (dbNumber) => {
        if (!dbNumber) return null;
        const match = dbNumber.match(/(\d+)/);
        return match ? match[0] : null;
    };

    const getFloorFromNumber = (numStr) => {
        if (!numStr) return 1;
        const match = numStr.match(/\d/);
        return match ? parseInt(match[0]) : 1;
    };

    const getTypeFromData = (equipment, description) => {
        const text = `${equipment} ${description}`.toLowerCase();
        if (text.includes('компьютер') || text.includes('пк')) {
            return 'computer';
        }
        return 'lecture';
    };

    // Функция для форматирования даты в Local ISO без Z
    const toLocalISO = (date) => {
        const pad = (n) => String(n).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = '00';
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(Number(filters.floor));
        }
    }, [filters.floor]);

    // Загрузка списка всех аудиторий
    useEffect(() => {
        const fetchAllRooms = async () => {
            try {
                const response = await publicApi.post('/database/get/Classroom', {});
                const roomsObj = {};
                if (Array.isArray(response.data)) {
                    response.data.forEach(room => {
                        const svgId = getSvgIdFromDbNumber(room.number);
                        if (svgId) {
                            const floor = getFloorFromNumber(svgId);
                            const type = getTypeFromData(room.equipment, room.description);
                            roomsObj[svgId] = {
                                dbId: room.id,
                                number: room.number,
                                capacity: room.capacity,
                                type: type,
                                status: 'free',
                                floor: floor
                            };
                        }
                    });
                    setAllRoomsData(roomsObj);
                }
            } catch (err) {
                console.error("Ошибка загрузки списка аудиторий:", err);
            }
        };
        fetchAllRooms();
    }, []);

    // Фильтрация
    const checkRoomFilters = (roomData, currentFilters) => {
        if (!roomData) return false;
        if (currentFilters.floor && String(currentFilters.floor) !== '' && String(roomData.floor) !== String(currentFilters.floor)) return false;
        const filterCap = parseInt(currentFilters.minCapacity, 10);
        const roomCap = parseInt(roomData.capacity, 10);
        if (!isNaN(filterCap) && filterCap > 0 && roomCap < filterCap) return false;
        if (currentFilters.roomType && currentFilters.roomType !== 'all' && roomData.type !== currentFilters.roomType) return false;
        return true;
    };

    const getFilteredRooms = useMemo(() => {
        const filteredIds = [];
        Object.keys(allRoomsData).forEach(svgId => {
            if (checkRoomFilters(allRoomsData[svgId], filters)) filteredIds.push(svgId);
        });
        return filteredIds;
    }, [filters, allRoomsData]);

    useEffect(() => {
        const roomsArray = Object.values(allRoomsData);
        const targetFloor = filters.floor ? filters.floor.toString() : '1';
        const totalOnFloor = roomsArray.filter(r => String(r.floor) === targetFloor).length;
        updateStats(getFilteredRooms.length, totalOnFloor);
    }, [getFilteredRooms, filters.floor, updateStats, allRoomsData]);

    const handleFloorChange = (floor) => {
        setCurrentFloor(floor);
        updateFilter('floor', floor.toString());
    };

    // --- ЗАПРОС ИНФОРМАЦИИ ОБ АУДИТОРИИ ---
    const fetchRoomInfo = async (svgId) => {
        setLoading(true);
        setError(null);
        try {
            const dbNumberSearch = `Б-${svgId}`;
            const response = await publicApi.post('/database/get/Classroom', {
                number: dbNumberSearch
            });

            const data = response.data;
            let room = null;

            if (Array.isArray(data) && data.length > 0) {
                room = data[0];
            } else if (data && !Array.isArray(data) && data.id) {
                room = data;
            }

            if (room) {
                let equipmentList = [];
                if (room.equipment) {
                    equipmentList = room.equipment.split(',').map(item => item.trim());
                } else {
                    equipmentList = ['Базовое оборудование'];
                }

                const roomType = getTypeFromData(room.equipment, room.description);

                setRoomInfo({
                    id: room.id,
                    name: room.number,
                    svgId: svgId,
                    type: roomType === 'computer' ? 'Компьютерный класс' : 'Лекционная',
                    capacity: room.capacity || 0,
                    equipment: equipmentList,
                    status: 'свободна',
                    description: room.description || '',
                    panorama: `${svgId}.jpg`,
                    eios_id: room.eios_id
                });

                setIsRoomModalOpen(true);
            } else {
                setError(`Аудитория ${dbNumberSearch} не найдена в базе данных.`);
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

    const handleRoomClick = (svgId) => {
        setSelectedRoom(svgId);
        fetchRoomInfo(svgId);
    };

    const parseTimeRange = (timeRangeStr) => {
        if (!timeRangeStr) return null;
        try {
            const [startStr, endStr] = timeRangeStr.split(' - ');
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);
            const duration = (endH * 60 + endM) - (startH * 60 + startM);
            return { startH, startM, duration };
        } catch (e) {
            console.error("Ошибка парсинга времени", e);
            return null;
        }
    };

    // --- БРОНИРОВАНИЕ ---
    const handleBookRoom = async (bookingPurpose) => {
        if (!roomInfo || !roomInfo.id) {
            alert("Ошибка: Не выбрана аудитория");
            return;
        }
        if (!user) {
            alert("Для бронирования необходимо авторизоваться");
            navigate('/login');
            return;
        }
        if (!filters.time) {
            alert("Пожалуйста, выберите время бронирования.");
            return;
        }

        // Получаем дату из фильтра (Header), если её нет - берем текущую
        const selectedDateStr = filters.date || new Date().toISOString().split('T')[0];

        const timeData = parseTimeRange(filters.time);
        if (!timeData || timeData.duration <= 0) {
            alert("Некорректный временной интервал.");
            return;
        }

        setLoading(true);
        try {
            // 1. Рассчитываем дату начала на основе выбранной даты из фильтра
            const [year, month, day] = selectedDateStr.split('-').map(Number);
            const startDate = new Date(year, month - 1, day, timeData.startH, timeData.startM, 0, 0);

            // 2. Рассчитываем дату окончания
            const endDate = new Date(startDate.getTime() + timeData.duration * 60000);

            // 3. Формируем Local ISO строки
            const dateStartISO = toLocalISO(startDate);
            const dateEndISO = toLocalISO(endDate);

            // 4. Формируем payload под модель Booking
            const payload = {
                classroom_id: roomInfo.id,
                date_start: dateStartISO,
                date_end: dateEndISO,
                user_id: user.id,
                description: bookingPurpose
            };

            console.log("Отправка бронирования:", payload);

            await privateApi.post('/booking/create', payload);

            const displayDate = startDate.toLocaleDateString();
            alert(`Заявка успешно создана!\nАудитория: ${roomInfo.name}\nДата: ${displayDate}\nВремя: ${filters.time}`);
            handleCloseModal();

        } catch (err) {
            console.error('Ошибка при бронировании:', err);
            let errMsg = 'Произошла ошибка при бронировании.';
            if (err.response && err.response.data && err.response.data.message) {
                errMsg += `\n${err.response.data.message}`;
            } else if (err.response && err.response.data && err.response.data.error) {
                errMsg += `\n${err.response.data.error}`;
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
        updateFilter('date', new Date().toISOString().split('T')[0]); // Сброс даты на сегодня
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
                    {mapMode === '2d' ? (
                        <InteractiveSVG
                            svgUrl={currentSVG}
                            onRoomClick={handleRoomClick}
                            selectedRoom={selectedRoom}
                            filteredRooms={getFilteredRooms}
                            currentFloor={currentFloor}
                        />
                    ) : (
                        <ThreeDViewer floor={currentFloor} />
                    )}

                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Загрузка информации...</div>
                        </div>
                    )}
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