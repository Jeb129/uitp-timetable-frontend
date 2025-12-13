// src/contexts/FilterContext.jsx
import React, {createContext, useState, useContext, useMemo, useCallback} from 'react';

const FilterContext = createContext();

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        // Заглушка на случай ошибок, чтобы не падало
        return {
            filters: { corpus: 'Б', floor: '1', minCapacity: 0, roomType: 'all', status: 'all' },
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
    const [filters, setFilters] = useState({
        corpus: 'Б',
        floor: '1',
        minCapacity: 0,
        roomType: 'all',
        status: 'all',
        timeRange: ''
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
        setFilters({
            corpus: 'Б',
            floor: null,
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            timeRange: ''
        });
    }, []);

    // Значения по умолчанию для быстрого сброса
    const resetToDefaults = useCallback(() => {
        setFilters({
            corpus: 'Б',
            floor: 2,
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            timeRange: ''
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