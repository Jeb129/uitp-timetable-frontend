// src/contexts/FilterContext.jsx
import React, { createContext, useState, useContext, useMemo } from 'react';

const FilterContext = createContext();

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        corpus: 'Б',
        floor: 1,
        minCapacity: 0,
        roomType: 'all', // 'all', 'lecture', 'study'
        status: 'all', // 'all', 'free', 'busy'
        timeRange: ''
    });

    const [roomStats, setRoomStats] = useState({
        found: 0,
        total: 0
    });

    const updateFilter = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const updateStats = (found, total) => {
        setRoomStats({ found, total });
    };



    const clearFilters = () => {
        setFilters({
            corpus: 'Б',
            floor: null,
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            timeRange: ''
        });
    };

    // Значения по умолчанию для быстрого сброса
    const resetToDefaults = () => {
        setFilters({
            corpus: 'Б',
            floor: 2, // начальный этаж как в MapPage
            minCapacity: 0,
            roomType: 'all',
            status: 'all',
            timeRange: ''
        });
    };

    const value = useMemo(() => ({
        filters,
        roomStats,
        updateFilter,
        updateStats,
        clearFilters,
        resetToDefaults
    }), [filters, roomStats, updateStats]);

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};