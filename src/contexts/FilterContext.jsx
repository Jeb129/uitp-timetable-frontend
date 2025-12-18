// src/contexts/FilterContext.jsx
import React, {createContext, useState, useContext, useMemo, useCallback} from 'react';

const FilterContext = createContext();

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        return {
            filters: { corpus: 'Б', floor: '1', minCapacity: 0, roomType: 'all', status: 'all', time: '', date: '' },
            roomStats: { found: 0, total: 0 },
            updateFilter: () => {},
            updateStats: () => {},
            resetToDefaults: () => {},
            clearFilters: () => {}
        };
    }
    return context;
};

export const FilterProvider = ({ children }) => {
    // Получаем текущую дату для дефолтного значения (опционально)
    const today = new Date().toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        corpus: 'Б',
        floor: '1',
        minCapacity: 0,
        roomType: 'all',
        status: 'all',
        time: '', // Исправлено с timeRange на time
        date: today // Добавлено поле даты по умолчанию
    });

    const [roomStats, setRoomStats] = useState({
        found: 0,
        total: 0
    });

    const updateFilter = useCallback((filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    }, []);

    const updateStats = useCallback((found, total) => {
        setRoomStats(prev => {
            if (prev.found === found && prev.total === total) {
                return prev;
            }
            return { found, total };
        });
    }, []);

    const clearFilters = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        setFilters({
            corpus: 'Б',
            floor: null,
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            time: '', // Исправлено
            date: todayStr // Сбрасываем на сегодня
        });
    }, []);

    // Значения по умолчанию для кнопки "Сбросить" в MapPage
    const resetToDefaults = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        setFilters({
            corpus: 'Б',
            floor: '1', // Обычно сбрасывают на 1 этаж
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            time: '', // Исправлено
            date: todayStr
        });
    }, []);

    const value = useMemo(() => ({
        filters,
        roomStats,
        updateFilter,
        updateStats,
        clearFilters,
        resetToDefaults
    }), [filters, roomStats, updateFilter, updateStats, resetToDefaults, clearFilters]);

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};