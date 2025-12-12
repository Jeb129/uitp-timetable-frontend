
import React, { useState, useEffect, useRef } from 'react';
import './InteractiveSVG.css';

const InteractiveSVG = ({
                            svgUrl,
                            onRoomClick,
                            selectedRoom,
                            filteredRooms = [], // Новый пропс - отфильтрованные аудитории
                            currentFloor // Новый пропс - текущий этаж
                        }) => {
    const [svgContent, setSvgContent] = useState('');
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        const loadSVG = async () => {
            try {
                const response = await fetch(svgUrl);
                const svgText = await response.text();
                setSvgContent(svgText);
            } catch (error) {
                console.error('Ошибка загрузки SVG:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSVG();
    }, [svgUrl]);

    // Эффект для подсветки отфильтрованных аудиторий
    useEffect(() => {
        if (!containerRef.current || !svgContent) return;

        const container = containerRef.current;
        const allRects = container.querySelectorAll('.interactive-rect');

        // Сначала сбрасываем все стили
        allRects.forEach(rect => {
            rect.classList.remove('filtered-in', 'filtered-out');

            // Проверяем, находится ли аудитория на текущем этаже
            const roomId = rect.id;
            const isOnCurrentFloor = currentFloor ?
                roomId.startsWith(currentFloor.toString()) : true;

            // Проверяем, проходит ли аудитория фильтры
            const isFiltered = filteredRooms.includes(roomId) && isOnCurrentFloor;

            if (isFiltered) {
                // Аудитория проходит фильтры и на текущем этаже
                rect.classList.add('filtered-in');
                rect.style.pointerEvents = 'auto';
                rect.style.opacity = '1';
                rect.style.cursor = 'pointer';
            } else {
                // Аудитория не проходит фильтры или не на текущем этаже
                rect.classList.add('filtered-out');
                rect.style.pointerEvents = 'none';
                rect.style.opacity = '0.3';
                rect.style.cursor = 'not-allowed';
            }
        });
    }, [svgContent, filteredRooms, currentFloor]);

    // Подсветка выбранной аудитории
    useEffect(() => {
        if (!containerRef.current || !svgContent) return;

        const container = containerRef.current;
        const allRects = container.querySelectorAll('.interactive-rect');

        // Снимаем выделение со всех
        allRects.forEach(rect => {
            rect.classList.remove('rect-selected');
        });

        // Выделяем выбранную
        if (selectedRoom) {
            const selectedRect = container.querySelector(`[id="${selectedRoom}"]`);
            if (selectedRect) {
                selectedRect.classList.add('rect-selected');
            }
        }
    }, [selectedRoom, svgContent]);

    useEffect(() => {
        if (!containerRef.current || !svgContent) return;

        const container = containerRef.current;

        const handleClick = (e) => {
            const rect = e.target.closest('.interactive-rect');
            if (rect && !rect.classList.contains('filtered-out')) {
                e.stopPropagation();

                const roomId = rect.id || rect.getAttribute('data-room-id') || 'unknown';

                console.log('Клик по аудитории:', roomId);

                if (onRoomClick) {
                    onRoomClick(roomId);
                }
            }
        };

        const handleMouseOver = (e) => {
            const rect = e.target.closest('.interactive-rect');
            if (rect && !rect.classList.contains('filtered-out')) {
                rect.classList.add('rect-hover');
            }
        };

        const handleMouseOut = (e) => {
            const rect = e.target.closest('.interactive-rect');
            if (rect) {
                rect.classList.remove('rect-hover');
            }
        };

        container.addEventListener('click', handleClick);
        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('mouseout', handleMouseOut);

        return () => {
            container.removeEventListener('click', handleClick);
            container.removeEventListener('mouseover', handleMouseOver);
            container.removeEventListener('mouseout', handleMouseOut);
        };
    }, [svgContent, onRoomClick]);

    if (loading) {
        return <div className="svg-loading">Загрузка плана этажа...</div>;
    }

    return (
        <div
            ref={containerRef}
            className="interactive-svg-container"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};

export default InteractiveSVG;