// src/pages/MapPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveSVG from '../components/InteractiveSVG';
import ThreeDViewer from "../components/ThreeDViewer.jsx";
import RoomModal from '../components/modals/RoomModal';
// Импортируем модалку оплаты
import PaymentModal from '../components/modals/PaymentModal';
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

    // --- Стейты для оплаты ---
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    // Данные аудитории
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Данные всех аудиторий и бронирований
    const [allRoomsData, setAllRoomsData] = useState({});
    const [bookings, setBookings] = useState([]);

    const { filters, updateFilter, updateStats } = useFilters();
    const [currentFloor, setCurrentFloor] = useState(Number(filters.floor) || 1);

    const floorSVGs = {
        '2d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D },
        '2.5d': { 1: Floor1_2D, 2: Floor2_2D, 3: Floor3_2D, 4: Floor4_2D }
    };

    // Хелперы (оставляем без изменений)
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

    // --- ЛОГИКА ТИПОВ ---
    const getTypeFromData = (equipment, description) => {
        const text = `${equipment || ''} ${description || ''}`.toLowerCase();
        if (text.includes('компьютер') || text.includes('пк') || text.includes('моноблок') || text.includes('ноутбук')) {
            return 'computer';
        }
        if (text.includes('лекц')) {
            return 'lecture';
        }
        return 'other';
    };

    const getRoomTypeLabel = (type) => {
        switch (type) {
            case 'computer': return 'Компьютерный класс';
            case 'lecture': return 'Лекционная аудитория';
            case 'other': return 'Другое / Служебное';
            default: return 'Аудитория';
        }
    };

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

    // --- ПАРСИНГ SQL ДАТЫ ---
    const parseSQLDate = (sqlDateStr) => {
        if (!sqlDateStr) return new Date(0);
        try {
            const [datePart, timePartFull] = sqlDateStr.split(' ');
            if (!datePart || !timePartFull) return new Date(sqlDateStr);
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = timePartFull.split('.')[0].split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, second);
        } catch (e) {
            console.error("Ошибка ручного парсинга даты:", sqlDateStr, e);
            return new Date(sqlDateStr);
        }
    };

    useEffect(() => {
        if (filters.floor && filters.floor !== '') {
            setCurrentFloor(Number(filters.floor));
        }
    }, [filters.floor]);

    // 1. Загрузка списка всех аудиторий
    useEffect(() => {
        const fetchAllRooms = async () => {
            try {
                const response = await publicApi.post('/database/get/Classroom', {});
                const roomsObj = {};
                const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);

                if (Array.isArray(data)) {
                    data.forEach(room => {
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

    // 2. Загрузка бронирований
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await privateApi.post('/database/get/Booking', {});
                const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
                setBookings(data);
            } catch (err) {
                console.error("Ошибка загрузки бронирований:", err);
            }
        };
        fetchBookings();
    }, []);

    const getFilterDateRange = (dateStr, timeRangeStr) => {
        if (!dateStr || !timeRangeStr) return null;
        try {
            const [startStr, endStr] = timeRangeStr.split(' - ');
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);
            const [year, month, day] = dateStr.split('-').map(Number);
            const filterStart = new Date(year, month - 1, day, startH, startM, 0);
            const filterEnd = new Date(year, month - 1, day, endH, endM, 0);
            return { start: filterStart, end: filterEnd };
        } catch (e) {
            console.error("Ошибка парсинга даты/времени фильтра", e);
            return null;
        }
    };

    // --- ГЛАВНАЯ ЛОГИКА ФИЛЬТРАЦИИ ---
    const checkRoomFilters = (roomData, currentFilters, activeBookings) => {
        if (!roomData) return false;
        if (currentFilters.floor && String(currentFilters.floor) !== '' && String(roomData.floor) !== String(currentFilters.floor)) return false;

        const filterCap = parseInt(currentFilters.minCapacity, 10);
        const roomCap = parseInt(roomData.capacity, 10);
        if (!isNaN(filterCap) && filterCap > 0 && roomCap < filterCap) return false;

        if (currentFilters.roomType && currentFilters.roomType !== 'all') {
            if (roomData.type !== currentFilters.roomType) return false;
        }

        if (currentFilters.time && currentFilters.date) {
            const searchRange = getFilterDateRange(currentFilters.date, currentFilters.time);
            if (searchRange) {
                const isOccupied = activeBookings.some(booking => {
                    if (String(booking.classroom_id) !== String(roomData.dbId)) return false;
                    if (booking.status === false) return false;
                    const bookingStart = parseSQLDate(booking.date_start);
                    const bookingEnd = parseSQLDate(booking.date_end);
                    const isIntersecting = (bookingStart < searchRange.end) && (bookingEnd > searchRange.start);
                    return isIntersecting;
                });
                if (isOccupied) return false;
            }
        }
        return true;
    };

    const getFilteredRooms = useMemo(() => {
        const filteredIds = [];
        Object.keys(allRoomsData).forEach(svgId => {
            if (checkRoomFilters(allRoomsData[svgId], filters, bookings)) {
                filteredIds.push(svgId);
            }
        });
        return filteredIds;
    }, [filters, allRoomsData, bookings]);

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

    const fetchRoomInfo = async (svgId) => {
        setLoading(true);
        setError(null);
        try {
            const dbNumberSearch = `Б-${svgId}`;
            const response = await publicApi.post('/database/get/Classroom', { number: dbNumberSearch });
            const data = response.data;
            let room = null;
            if (Array.isArray(data) && data.length > 0) { room = data[0]; }
            else if (data && !Array.isArray(data) && data.id) { room = data; }

            if (room) {
                let equipmentList = [];
                if (room.equipment) { equipmentList = room.equipment.split(',').map(item => item.trim()); }
                else { equipmentList = ['Базовое оборудование']; }
                const typeCode = getTypeFromData(room.equipment, room.description);
                const typeLabel = getRoomTypeLabel(typeCode);
                setRoomInfo({
                    id: room.id,
                    name: room.number,
                    svgId: svgId,
                    type: typeLabel,
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

    // --- БРОНИРОВАНИЕ (ОБНОВЛЕННАЯ ЛОГИКА) ---
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

        const selectedDateStr = filters.date || new Date().toISOString().split('T')[0];
        const timeData = parseTimeRange(filters.time);

        if (!timeData || timeData.duration <= 0) {
            alert("Некорректный временной интервал.");
            return;
        }

        setLoading(true);
        try {
            const [year, month, day] = selectedDateStr.split('-').map(Number);
            const startDate = new Date(year, month - 1, day, timeData.startH, timeData.startM, 0, 0);
            const endDate = new Date(startDate.getTime() + timeData.duration * 60000);

            const dateStartISO = toLocalISO(startDate);
            const dateEndISO = toLocalISO(endDate);

            const payload = {
                classroom_id: roomInfo.id,
                date_start: dateStartISO,
                date_end: dateEndISO,
                user_id: user.id,
                description: bookingPurpose
            };

            const response = await privateApi.post('/booking/create', payload);
            const responseData = response.data; // Получаем ответ { message, booking_id, total_cost }

            // Обновляем список бронирований
            const bookingsRes = await privateApi.post('/database/get/Booking', {});
            const bookingsList = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data?.results || []);
            setBookings(bookingsList);

            // Закрываем окно бронирования аудитории
            handleCloseModal();

            // --- ПРОВЕРКА НА ОПЛАТУ (НОВАЯ ЛОГИКА) ---
            const userRole = user.role || 'guest';
            const cost = parseFloat(responseData.total_cost || 0);

            if (userRole === 'user' && cost > 0) {
                // Если внешний пользователь и цена > 0 -> Открываем окно оплаты
                setPaymentAmount(cost);
                setIsPaymentModalOpen(true);
            } else {
                // Иначе стандартное уведомление
                const displayDate = startDate.toLocaleDateString();
                alert(`Заявка успешно создана!\nАудитория: ${roomInfo.name}\nДата: ${displayDate}\nВремя: ${filters.time}`);
            }

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

    // Закрытие окна оплаты
    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        // Можно показать алерт после оплаты, если нужно
        alert('Спасибо! Бронирование завершено.');
    };

    const handleResetFilters = () => {
        updateFilter('floor', '');
        updateFilter('minCapacity', 0);
        updateFilter('roomType', 'all');
        updateFilter('status', 'all');
        updateFilter('time', '');
        updateFilter('date', new Date().toISOString().split('T')[0]);
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
                        <button className={`quick-filter-btn ${filters.roomType === 'other' ? 'active' : ''}`} onClick={() => updateFilter('roomType', filters.roomType === 'other' ? 'all' : 'other')}>Другие</button>
                        <button className={`quick-filter-btn ${filters.minCapacity === 30 ? 'active' : ''}`} onClick={() => updateFilter('minCapacity', filters.minCapacity === 30 ? 0 : 30)}>От 30 мест</button>
                    </div>
                </div>

                <div className="filter-stats">
                    <div className="stats-badge">
                        <span className="stats-text">Показано: <strong>{getFilteredRooms.length}</strong></span>
                    </div>
                    {(filters.floor || filters.minCapacity > 0 || filters.roomType !== 'all' || filters.status !== 'all' || filters.time) && (
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

            {/* Модальное окно оплаты */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={handleClosePaymentModal}
                amount={paymentAmount}
            />
        </div>
    );
};

export default MapPage;