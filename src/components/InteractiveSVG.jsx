import React, { useState, useEffect, useRef } from 'react';
import './InteractiveSVG.css';

const InteractiveSVG = ({
                            svgUrl,
                            onRoomClick,
                            selectedRoom,
                            filteredRooms = [],
                            currentFloor
                        }) => {
    const [originalSvg, setOriginalSvg] = useState('');
    const [displaySvg, setDisplaySvg] = useState('');

    const containerRef = useRef(null);

    // 1. Загрузка
    useEffect(() => {
        let isMounted = true;
        const loadSVG = async () => {
            try {
                const response = await fetch(svgUrl);
                const text = await response.text();
                if (isMounted) setOriginalSvg(text);
            } catch (error) {
                console.error('Ошибка:', error);
            }
        };
        loadSVG();
        return () => { isMounted = false; };
    }, [svgUrl]);

    // Хэш фильтров
    const filtersHash = filteredRooms.map(String).sort().join(',');

    // 2. Парсинг и покраска (ОСТАВЛЯЕМ КАК БЫЛО)
    useEffect(() => {
        if (!originalSvg) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(originalSvg, 'image/svg+xml');

        const allowedSet = new Set(filteredRooms.map(id => String(id).trim()));
        const selectedId = selectedRoom ? String(selectedRoom).trim() : null;

        const allElements = doc.querySelectorAll('[id]');

        allElements.forEach(el => {
            const rawId = el.id;
            if (!rawId || /Layer|Слой|Metadata|Defs|g_/i.test(rawId)) return;

            const isAllowed = allowedSet.has(rawId);
            const isSelected = (rawId === selectedId);

            const existingClass = el.getAttribute('class') || '';
            const isInteractive = existingClass.includes('interactive-rect') || isAllowed || isSelected;

            if (!isInteractive) return;

            let newClass = 'interactive-rect';

            if (isAllowed) {
                newClass += ' filtered-in';
            } else {
                newClass += ' filtered-out';
            }

            if (isSelected) {
                // Если кликнули по серой, она станет цветной и выбранной
                newClass = newClass.replace('filtered-out', 'filtered-in');
                newClass += ' rect-selected';
            }

            el.setAttribute('class', newClass);
        });

        const serializer = new XMLSerializer();
        setDisplaySvg(serializer.serializeToString(doc));

    }, [originalSvg, filtersHash, selectedRoom]);

    // ОБРАБОТЧИК КЛИКОВ
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const handleClick = (e) => {
            const target = e.target.closest('.interactive-rect');
            if (target) {
                if (onRoomClick) onRoomClick(target.id);
            }
        };

        container.addEventListener('click', handleClick);
        return () => container.removeEventListener('click', handleClick);
    }, [displaySvg, onRoomClick]);

    if (!displaySvg) return <div className="svg-loading">Загрузка...</div>;

    return (
        <div
            ref={containerRef}
            className="interactive-svg-container"
            dangerouslySetInnerHTML={{ __html: displaySvg }}
        />
    );
};

export default InteractiveSVG;