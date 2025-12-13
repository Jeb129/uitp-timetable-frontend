// src/utils/rulesValidator.js

/**
 * Правила бронирования (основные константы)
 */
export const BOOKING_RULES = {
    TIME_RANGES: {
        INTERNAL: { start: 8, end: 20 }, // 8:00 - 20:00 для сотрудников/студентов
        EXTERNAL: { start: 8, end: 17 }  // 8:00 - 17:00 для внешних пользователей
    },
    MIN_DURATION: 15, // минимальная продолжительность в минутах
    DAYS: {
        WORKING: [1, 2, 3, 4, 5, 6], // Пн-Сб
        WEEKEND: [0] // Воскресенье
    },
    DEADLINES: {
        STUDENT: 15, // за 15 минут для студентов
        EXTERNAL: 24 * 60 // за 1 день для внешних пользователей (в минутах)
    },
    NO_SHOW_TIMEOUT: 30, // 30 минут на неявку
    BUFFER_TIMES: {
        BEFORE_EVENT: 15, // 15 минут до начала следующего
        AFTER_EVENT: 10   // 10 минут после окончания предыдущего
    }
};

/**
 * Получает разрешенный временной диапазон для типа пользователя
 */
export const getAllowedTimeRange = (userType) => {
    const now = new Date();
    const isSunday = now.getDay() === 0;

    if (isSunday) {
        return { start: null, end: null }; // Воскресенье - выходной
    }

    return userType === 'external'
        ? BOOKING_RULES.TIME_RANGES.EXTERNAL
        : BOOKING_RULES.TIME_RANGES.INTERNAL;
};

/**
 * Генерирует доступные временные интервалы для пользователя
 */
export const getFilteredTimes = (userType) => {
    const now = new Date();
    const allowedRange = getAllowedTimeRange(userType);
    const isDayOk = isDayAvailable(now, userType);

    if (!isDayOk || !allowedRange.start || !allowedRange.end) {
        return [];
    }

    const times = [];
    const interval = 2; // 2-часовые интервалы

    for (let hour = allowedRange.start; hour < allowedRange.end; hour += interval) {
        const startHour = hour;
        const endHour = Math.min(hour + interval, allowedRange.end);

        // Для внешних пользователей обрезаем до 17:00
        if (userType === 'external' && startHour >= 17) break;

        // Форматируем время
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;

        // Проверяем, что интервал не меньше минимальной длительности
        const duration = (endHour - startHour) * 60; // в минутах
        if (duration >= BOOKING_RULES.MIN_DURATION) {
            times.push({
                value: `${startTime} - ${endTime}`,
                label: `${startTime} - ${endTime}`,
                start: startTime,
                end: endTime,
                duration: duration
            });
        }
    }

    return times;
};

/**
 * Проверяет, доступен ли день для бронирования
 */
export const isDayAvailable = (date, userType) => {
    const dayOfWeek = date.getDay();

    // Воскресенье - выходной для всех
    if (dayOfWeek === 0) return false;

    // Для внешних пользователей проверяем только рабочие дни
    if (userType === 'external') {
        return BOOKING_RULES.DAYS.WORKING.includes(dayOfWeek);
    }

    // Для внутренних - все дни кроме воскресенья
    return dayOfWeek !== 0;
};

/**
 * Проверяет временной диапазон на соответствие правилам
 */
export const validateTimeRange = (startTime, endTime, userType) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const allowedRange = getAllowedTimeRange(userType);

    if (!allowedRange.start || !allowedRange.end) {
        return { isValid: false, message: 'Бронирование недоступно в этот день' };
    }

    if (startHour < allowedRange.start) {
        return {
            isValid: false,
            message: `Бронирование доступно с ${allowedRange.start}:00`
        };
    }

    if (endHour > allowedRange.end) {
        return {
            isValid: false,
            message: `Бронирование доступно до ${allowedRange.end}:00`
        };
    }

    // Проверка минимальной длительности
    const startMinutes = startHour * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = endHour * 60 + parseInt(endTime.split(':')[1]);
    const duration = endMinutes - startMinutes;

    if (duration < BOOKING_RULES.MIN_DURATION) {
        return {
            isValid: false,
            message: `Минимальная продолжительность бронирования - ${BOOKING_RULES.MIN_DURATION} минут`
        };
    }

    return { isValid: true, message: '' };
};

/**
 * Проверяет дедлайн для бронирования
 */
export const validateBookingDeadline = (bookingDateTime, userType) => {
    const now = new Date();
    const bookingTime = new Date(bookingDateTime);
    const timeDiff = (bookingTime - now) / (1000 * 60); // разница в минутах

    if (userType === 'student' && timeDiff < BOOKING_RULES.DEADLINES.STUDENT) {
        return {
            isValid: false,
            message: 'Студенты должны бронировать не позже, чем за 15 минут до начала'
        };
    }

    if (userType === 'external' && timeDiff < BOOKING_RULES.DEADLINES.EXTERNAL) {
        return {
            isValid: false,
            message: 'Внешние пользователи должны бронировать не позже, чем за 1 день'
        };
    }

    return { isValid: true, message: '' };
};

/**
 * Проверяет возможность бронирования с учетом других мероприятий
 */
export const validateTimeSlot = (startTime, endTime, existingEvents, room) => {
    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);

    // Проверяем пересечения с существующими мероприятиями
    for (const event of existingEvents) {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        // Проверка на полное или частичное пересечение
        if (
            (bookingStart >= eventStart && bookingStart < eventEnd) ||
            (bookingEnd > eventStart && bookingEnd <= eventEnd) ||
            (bookingStart <= eventStart && bookingEnd >= eventEnd)
        ) {
            return {
                isValid: false,
                message: `Аудитория занята в это время другим мероприятием`
            };
        }

        // Проверка буферного времени до следующего мероприятия
        const timeBeforeNextEvent = (eventStart - bookingEnd) / (1000 * 60);
        if (timeBeforeNextEvent > 0 && timeBeforeNextEvent < BOOKING_RULES.BUFFER_TIMES.BEFORE_EVENT) {
            return {
                isValid: false,
                message: `Между мероприятиями должно быть не менее ${BOOKING_RULES.BUFFER_TIMES.BEFORE_EVENT} минут`
            };
        }

        // Проверка буферного времени после предыдущего мероприятия
        const timeAfterPrevEvent = (bookingStart - eventEnd) / (1000 * 60);
        if (timeAfterPrevEvent > 0 && timeAfterPrevEvent < BOOKING_RULES.BUFFER_TIMES.AFTER_EVENT) {
            return {
                isValid: false,
                message: `После предыдущего мероприятия должно пройти не менее ${BOOKING_RULES.BUFFER_TIMES.AFTER_EVENT} минут`
            };
        }
    }

    return { isValid: true, message: '' };
};

/**
 * Проверяет оборудование в заявке
 */
export const validateEquipment = (equipment, requiredEquipment = []) => {
    if (!equipment || equipment.length === 0) {
        if (requiredEquipment.length > 0) {
            return {
                isValid: false,
                message: 'В заявке необходимо указать оборудование'
            };
        }
        return { isValid: true, message: '' };
    }

    // Проверяем, что все необходимое оборудование указано
    const missingEquipment = requiredEquipment.filter(item =>
        !equipment.includes(item)
    );

    if (missingEquipment.length > 0) {
        return {
            isValid: false,
            message: `Отсутствует обязательное оборудование: ${missingEquipment.join(', ')}`
        };
    }

    return { isValid: true, message: '' };
};

/**
 * Проверяет все правила бронирования сразу
 */
export const validateAllBookingRules = (bookingData, userType, existingEvents = []) => {
    const {
        date,
        startTime,
        endTime,
        equipment,
        room
    } = bookingData;

    // 1. Проверка дня недели
    const bookingDate = new Date(`${date}T${startTime}`);
    if (!isDayAvailable(bookingDate, userType)) {
        return {
            isValid: false,
            message: 'Бронирование недоступно в этот день'
        };
    }

    // 2. Проверка временного диапазона
    const timeRangeValidation = validateTimeRange(startTime, endTime, userType);
    if (!timeRangeValidation.isValid) return timeRangeValidation;

    // 3. Проверка дедлайна
    const deadlineValidation = validateBookingDeadline(`${date}T${startTime}`, userType);
    if (!deadlineValidation.isValid) return deadlineValidation;

    // 4. Проверка временного слота
    const timeSlotValidation = validateTimeSlot(
        `${date}T${startTime}`,
        `${date}T${endTime}`,
        existingEvents.filter(event => event.room === room),
        room
    );
    if (!timeSlotValidation.isValid) return timeSlotValidation;

    // 5. Проверка оборудования
    const equipmentValidation = validateEquipment(equipment);
    if (!equipmentValidation.isValid) return equipmentValidation;

    return { isValid: true, message: '' };
};

/**
 * Получает доступные временные слоты для пользователя
 */
export const getAvailableTimeSlots = (date, userType, existingEvents = []) => {
    const slots = [];
    const allowedRange = getAllowedTimeRange(userType);

    if (!allowedRange.start || !allowedRange.end) {
        return slots; // Нет доступных слотов
    }

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    for (let hour = allowedRange.start; hour < allowedRange.end; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            // Пропускаем слоты, которые уже прошли для сегодняшнего дня
            if (isToday) {
                const slotTime = new Date();
                slotTime.setHours(hour, minute, 0, 0);
                if (slotTime < today) continue;
            }

            // Проверяем, свободен ли слот
            const isSlotAvailable = !existingEvents.some(event => {
                const eventStart = new Date(event.startTime);
                const eventEnd = new Date(event.endTime);
                const slotStart = new Date(`${date.toISOString().split('T')[0]}T${startTime}`);
                const slotEnd = new Date(`${date.toISOString().split('T')[0]}T${endTime}`);

                return (
                    (slotStart >= eventStart && slotStart < eventEnd) ||
                    (slotEnd > eventStart && slotEnd <= eventEnd)
                );
            });

            if (isSlotAvailable) {
                slots.push({
                    start: startTime,
                    end: endTime,
                    label: `${startTime} - ${endTime}`
                });
            }
        }
    }

    return slots;
};

/**
 * Утилита для форматирования времени
 */
export const formatTimeRangeForDisplay = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
};

/**
 * Проверяет, является ли пользователь внутренним
 */
export const isInternalUser = (userType) => {
    return ['student', 'employee', 'admin'].includes(userType);
};

/**
 * Проверяет, является ли пользователь внешним
 */
export const isExternalUser = (userType) => {
    return userType === 'external';
};

export default {
    BOOKING_RULES,
    getAllowedTimeRange,
    isDayAvailable,
    validateTimeRange,
    validateBookingDeadline,
    validateTimeSlot,
    validateEquipment,
    validateAllBookingRules,
    getAvailableTimeSlots,
    formatTimeRangeForDisplay,
    isInternalUser,
    isExternalUser
};