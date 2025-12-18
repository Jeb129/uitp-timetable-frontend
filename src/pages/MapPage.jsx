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
    const [selectedRoom, setSelectedRoom] = useState(null); // Здесь хранится SVG ID (например, "101")
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

    // Хелпер: извлечение номера для SVG из номера в БД ("Б-101" -> "101")
    const getSvgIdFromDbNumber = (dbNumber) => {
        if (!dbNumber) return null;
        const match = dbNumber.match(/(\d+)/);
        return match ? match[0] : null;
    };

    // Хелпер: определение этажа по номеру (101 -> 1, 205 -> 2)
    const getFloorFromNumber = (numStr) => {
        if (!numStr) return 1;
        const match = numStr.match(/\d/);
        return match ? parseInt(match[0]) : 1;
    };

    // Хелпер: определение типа
    const getTypeFromData = (equipment, description) => {
        const text = `${equipment} ${description}`.toLowerCase();
        if (text.includes('компьютер') || text.includes('пк')) {
            return 'computer';
        }
        return 'lecture';
    };

    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(Number(filters.floor));
        }
    }, [filters.floor]);

    // Загрузка списка всех аудиторий для карты
    useEffect(() => {
        const fetchAllRooms = async () => {
            try {
                // Запрашиваем все аудитории без фильтров
                const response = await publicApi.post('/database/get/Classroom', {});

                const roomsObj = {};
                if (Array.isArray(response.data)) {
                    response.data.forEach(room => {
                        const svgId = getSvgIdFromDbNumber(room.number);

                        if (svgId) {
                            const floor = getFloorFromNumber(svgId);
                            const type = getTypeFromData(room.equipment, room.description);

                            roomsObj[svgId] = {
                                dbId: room.id, // Сохраняем реальный ID записи
                                number: room.number, // "Б-101"
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
        Object.keys(allRoomsData).forEach(svgId => {
            if (checkRoomFilters(allRoomsData[svgId], filters)) {
                filteredIds.push(svgId);
            }
        });
        return filteredIds;
    }, [filters, allRoomsData]);

    // Статистика
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

    // --- ЗАПРОС ИНФОРМАЦИИ О КОНКРЕТНОЙ АУДИТОРИИ ---
    const fetchRoomInfo = async (svgId) => {
        setLoading(true);
        setError(null);
        try {
            // Используем жесткую привязку к корпусу "Б"
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
                    id: room.id,          // Primary Key для бронирования
                    name: room.number,    // "Б-101"
                    svgId: svgId,         // "101"
                    type: roomType === 'computer' ? 'Компьютерный класс' : 'Лекционная',
                    capacity: room.capacity || 0,
                    equipment: equipmentList,
                    status: 'свободна',
                    description: room.description || '',
                    // ИЗМЕНЕНИЕ: Формируем ссылку на панораму на фронтенде
                    // Убедитесь, что файлы лежат в папке public (или assets) по пути, который ожидает CylindricalPanorama
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
    const handleBookRoom = async () => {
        if (!roomInfo || !roomInfo.id) {
            alert("Ошибка: Не выбрана аудитория или отсутствуют данные");
            return;
        }

        if (!user) {
            alert("Для бронирования необходимо авторизоваться");
            navigate('/login');
            return;
        }

        const selectedTimeStr = filters.time;

        if (!selectedTimeStr) {
            alert("Пожалуйста, выберите время бронирования в верхней панели.");
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

            // Если время уже прошло сегодня, переносим на завтра
            const now = new Date();
            if (bookingDate < now) {
                bookingDate.setDate(bookingDate.getDate() + 1);
            }

            // Формируем ISO строку вручную в ЛОКАЛЬНОМ времени (без Z)
            const year = bookingDate.getFullYear();
            const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
            const day = String(bookingDate.getDate()).padStart(2, '0');
            const hours = String(bookingDate.getHours()).padStart(2, '0');
            const minutes = String(bookingDate.getMinutes()).padStart(2, '0');
            const seconds = '00';

            const localIsoDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

            console.log("Отправка бронирования:", {
                classroom_number: roomInfo.id,
                date: localIsoDate,
                duration: timeData.duration,
                user_id: user.id
            });

            await privateApi.post('/booking/create', {
                classroom_number: roomInfo.id,
                date: localIsoDate,
                duration: timeData.duration,
                user_id: user.id
            });

            const displayDate = bookingDate.toLocaleDateString();

            alert(`Заявка успешно создана!\nАудитория: ${roomInfo.name}\nДата: ${displayDate}\nВремя: ${selectedTimeStr}`);
            handleCloseModal();

        } catch (err) {
            console.error('Ошибка при бронировании:', err);
            let errMsg = 'Произошла ошибка при бронировании.';
            if (err.response && err.response.data && err.response.data.error) {
                errMsg += `\nДетали: ${err.response.data.error}`;
            } else if (err.response && err.response.data && err.response.data.message) {
                errMsg += `\n${err.response.data.message}`;
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