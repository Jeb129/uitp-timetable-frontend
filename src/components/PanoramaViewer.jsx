// src/components/panorama/PanoramaViewer.jsx
import React, { useState, useRef, useEffect } from 'react';
import './PanoramaViewer.css';

const PanoramaViewer = ({ imageUrl, onClose }) => {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Формируем путь к панораме
    const getPanoramaPath = () => {
        // Если путь уже начинается с /, используем как есть
        if (imageUrl.startsWith('/')) {
            return imageUrl;
        }
        // Иначе добавляем базовый путь
        return `/panoramas/${imageUrl}`;
    };

    const panoramaPath = getPanoramaPath();

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPos({
            x: e.clientX - rotation.y,
            y: e.clientY
        });
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        // Вычисляем только горизонтальное смещение
        const deltaX = e.clientX - startPos.x;

        // Ограничиваем вращение только по горизонтали (Y)
        const newRotationY = deltaX;

        setRotation({
            x: 0, // Фиксируем по вертикали
            y: newRotationY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setStartPos({
                x: e.touches[0].clientX - rotation.y,
                y: e.touches[0].clientY
            });
        }
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;

        const deltaX = e.touches[0].clientX - startPos.x;
        const newRotationY = deltaX;

        setRotation({
            x: 0,
            y: newRotationY
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Предотвращаем скролл страницы
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const resetView = () => {
        setRotation({ x: 0, y: 0 });
    };

    // Автоматическое вращение (опционально)
    useEffect(() => {
        if (imageLoaded && !isDragging) {
            const interval = setInterval(() => {
                setRotation(prev => ({
                    ...prev,
                    y: prev.y + 0.2
                }));
            }, 16);

            return () => clearInterval(interval);
        }
    }, [imageLoaded, isDragging]);

    return (
        <div className="panorama-overlay" onClick={onClose}>
            <div className="panorama-container" onClick={(e) => e.stopPropagation()}>
                <div className="panorama-header">
                    <h3>Виртуальный тур 360°</h3>
                    <div className="header-controls">
                        <button className="reset-btn" onClick={resetView}>
                            🔄 Сбросить вид
                        </button>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="panorama-content">
                    {!imageLoaded && !imageError && (
                        <div className="panorama-loading">
                            <div className="loading-spinner"></div>
                            <p>Загрузка панорамы...</p>
                        </div>
                    )}

                    {imageError && (
                        <div className="panorama-error">
                            <div className="error-icon">⚠️</div>
                            <p>Не удалось загрузить панораму</p>
                            <p>Проверьте наличие файла: {imageUrl}</p>
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        className="panorama-viewport"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                    >
                        <div
                            className="panorama-image-container"
                            style={{
                                transform: `translateX(-50%) rotateY(${rotation.y}deg)`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                opacity: imageLoaded ? 1 : 0,
                                display: imageError ? 'none' : 'block'
                            }}
                        >
                            <img
                                ref={imageRef}
                                src={panoramaPath}
                                alt="Панорама аудитории"
                                className="panorama-image"
                                draggable="false"
                                onLoad={() => {
                                    setImageLoaded(true);
                                    setImageError(false);
                                }}
                                onError={() => {
                                    console.error('Ошибка загрузки панорамы:', panoramaPath);
                                    setImageError(true);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="panorama-instructions">
                    <p>🖱️ Перетаскивайте горизонтально для осмотра помещения</p>
                    <p>📱 На мобильных устройствах - двигайте пальцем влево/вправо</p>
                </div>
            </div>
        </div>
    );
};

export default PanoramaViewer;