// src/components/InteractiveSVG.jsx
import React, { useState, useEffect, useRef } from 'react';
import './InteractiveSVG.css';

const InteractiveSVG = ({ svgUrl, onRoomClick, selectedRoom }) => {
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

    useEffect(() => {
        if (!containerRef.current || !svgContent) return;

        const container = containerRef.current;

        const handleClick = (e) => {
            const rect = e.target.closest('.interactive-rect');
            if (rect) {
                e.stopPropagation();

                const roomId = rect.id || rect.getAttribute('data-room-id') || 'unknown';

                console.log('Клик по аудитории:', roomId);
                console.log('Координаты:', {
                    x: rect.getAttribute('x'),
                    y: rect.getAttribute('y'),
                    width: rect.getAttribute('width'),
                    height: rect.getAttribute('height')
                });

                if (onRoomClick) {
                    onRoomClick(roomId);
                }
            }
        };

        const handleMouseOver = (e) => {
            const rect = e.target.closest('.interactive-rect');
            if (rect) {
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

    // Подсветка выбранной комнаты - ИСПРАВЛЕННАЯ ВЕРСИЯ
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const allRects = container.querySelectorAll('.interactive-rect');

        // Снимаем выделение со всех
        allRects.forEach(rect => {
            rect.classList.remove('rect-selected');
        });

        // Выделяем выбранную - используем data-room-id вместо ID
        if (selectedRoom) {
            const selectedRect = container.querySelector(`[id="${selectedRoom}"]`);
            if (selectedRect) {
                selectedRect.classList.add('rect-selected');
            }
        }
    }, [selectedRoom]);

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