// src/components/panorama/CylindricalPanorama.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import './CylindricalPanorama.css';

const CylindricalPanorama = ({ imageUrl, onClose }) => {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const meshRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    const isUserInteractingRef = useRef(false);
    const onMouseDownMouseXRef = useRef(0);
    const onMouseDownMouseYRef = useRef(0);
    const onMouseDownLonRef = useRef(0);
    const onMouseDownLatRef = useRef(0);
    const lonRef = useRef(0);
    const latRef = useRef(0);
    const phiRef = useRef(0);
    const thetaRef = useRef(0);

    const animationIdRef = useRef(null);

    // Формируем путь к панораме
    const getPanoramaPath = useCallback(() => {
        // Проверяем, если это уже полный URL
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        // Если путь уже начинается с /, используем как есть
        if (imageUrl.startsWith('/')) {
            return imageUrl;
        }
        // Иначе добавляем базовый путь
        return `/panoramas/${imageUrl}`;
    }, [imageUrl]);

    // Проверка поддержки WebGL
    const checkWebGLSettings = useCallback(() => {
        const info = [];

        // Проверяем canvas
        const canvas = document.createElement('canvas');
        info.push(`Canvas доступен: ${!!canvas}`);

        // Проверяем WebGL
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        info.push(`WebGL доступен: ${!!gl}`);

        if (gl) {
            info.push(`Вендор: ${gl.getParameter(gl.VENDOR)}`);
            info.push(`Рендерер: ${gl.getParameter(gl.RENDERER)}`);
            info.push(`Версия WebGL: ${gl.getParameter(gl.VERSION)}`);
        }

        // Проверяем Three.js
        info.push(`Three.js доступен: ${!!THREE}`);
        info.push(`THREE.REVISION: ${THREE.REVISION}`);

        return info.join('\n');
    }, []);

    // Инициализация Three.js
    const initThreeJS = useCallback(() => {
        if (!mountRef.current) {
            setError('Контейнер для 3D не найден');
            return false;
        }

        try {
            // Создаем сцену
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            // Создаем камеру
            const camera = new THREE.PerspectiveCamera(
                1, // fov
                mountRef.current.clientWidth / mountRef.current.clientHeight,
                0.1,
                1000
            );
            cameraRef.current = camera;
            camera.position.z = 0.1;

            // Создаем рендерер
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });

            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 1);

            // Очищаем контейнер
            while (mountRef.current.firstChild) {
                mountRef.current.removeChild(mountRef.current.firstChild);
            }

            mountRef.current.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Создаем цилиндр для панорамы
            const geometry = new THREE.CylinderGeometry(1, 1, 2, 60, 60, true);

            // Разворачиваем внутрь
            geometry.scale(-1, 1, 1);

            // Создаем материал с тестовой текстурой
            const texture = createTestTexture();

            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
                transparent: true,
                opacity: 1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.y = Math.PI; // Поворачиваем, чтобы шов был сзади
            scene.add(mesh);
            meshRef.current = mesh;

            // Добавляем источник света (хотя для MeshBasicMaterial не обязательно)
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            scene.add(ambientLight);

            // Загружаем реальную текстуру
            const textureLoader = new THREE.TextureLoader();
            const panoramaPath = getPanoramaPath();

            console.log('Пытаюсь загрузить панораму:', panoramaPath);

            textureLoader.load(
                panoramaPath,
                (loadedTexture) => {
                    console.log('Текстура загружена успешно');
                    console.log('Размер текстуры:', loadedTexture.image.width, 'x', loadedTexture.image.height);

                    loadedTexture.minFilter = THREE.LinearFilter;
                    loadedTexture.magFilter = THREE.LinearFilter;
                    loadedTexture.encoding = THREE.sRGBEncoding;

                    if (meshRef.current) {
                        meshRef.current.material.map = loadedTexture;
                        meshRef.current.material.needsUpdate = true;
                    }

                    setIsLoading(false);

                    setDebugInfo(prev => prev + `\nТекстура загружена: ${loadedTexture.image.width}x${loadedTexture.image.height}`);
                },
                (xhr) => {
                    const percent = (xhr.loaded / xhr.total) * 100;
                    console.log(`Загружено: ${Math.round(percent)}%`);
                    setDebugInfo(prev => prev + `\nЗагрузка: ${Math.round(percent)}%`);
                },
                (err) => {
                    console.error('Ошибка загрузки текстуры:', err);
                    setError(`Не удалось загрузить панораму. Ошибка: ${err.message || 'Неизвестная ошибка'}`);
                    setIsLoading(false);

                    // Используем тестовую текстуру как fallback
                    const testTexture = createTestTexture();
                    if (meshRef.current) {
                        meshRef.current.material.map = testTexture;
                        meshRef.current.material.needsUpdate = true;
                        setIsLoading(false);
                        setDebugInfo(prev => prev + '\nИспользуется тестовая текстура');
                    }
                }
            );

            // Анимация
            const animate = () => {
                animationIdRef.current = requestAnimationFrame(animate);

                // Автоматическое вращение, если пользователь не взаимодействует
                if (!isUserInteractingRef.current && meshRef.current) {
                    lonRef.current += 0; // Скорость автоматического вращения
                }

                // Вычисляем новые углы
                latRef.current = Math.max(-85, Math.min(85, latRef.current));
                phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
                thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

                // Обновляем позицию камеры
                if (cameraRef.current) {
                    cameraRef.current.position.x = 100 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
                    cameraRef.current.position.y = 100 * Math.cos(phiRef.current);
                    cameraRef.current.position.z = 100 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);
                    cameraRef.current.lookAt(0, 0, 0);
                }

                renderer.render(scene, camera);
            };

            animate();

            return true;
        } catch (error) {
            console.error('Ошибка инициализации Three.js:', error);
            setError(`Ошибка инициализации 3D: ${error.message}`);
            setIsLoading(false);
            return false;
        }
    }, [getPanoramaPath]);

    // Создаем тестовую текстуру
    const createTestTexture = useCallback(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Создаем градиентный фон
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.25, '#ffff00');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(0.75, '#00ffff');
        gradient.addColorStop(1, '#0000ff');

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Добавляем текст
        context.fillStyle = 'white';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('3D ПАНОРАМА', canvas.width / 2, canvas.height / 2);

        context.font = 'bold 40px Arial';
        context.fillText('Тестовое изображение', canvas.width / 2, canvas.height / 2 + 100);
        context.fillText('Размер: 2048x1024', canvas.width / 2, canvas.height / 2 + 160);

        // Добавляем сетку
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 2;

        // Вертикальные линии
        for (let i = 0; i <= 8; i++) {
            context.beginPath();
            context.moveTo(i * 256, 0);
            context.lineTo(i * 256, canvas.height);
            context.stroke();
        }

        // Горизонтальные линии
        for (let i = 0; i <= 4; i++) {
            context.beginPath();
            context.moveTo(0, i * 256);
            context.lineTo(canvas.width, i * 256);
            context.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        return texture;
    }, []);

    // Обработчики событий мыши
    const setupEventListeners = useCallback(() => {
        if (!mountRef.current) return;

        const onDocumentMouseDown = (event) => {
            event.preventDefault();

            isUserInteractingRef.current = true;
            onMouseDownMouseXRef.current = event.clientX;
            onMouseDownMouseYRef.current = event.clientY;
            onMouseDownLonRef.current = lonRef.current;
            onMouseDownLatRef.current = latRef.current;
        };

        const onDocumentMouseMove = (event) => {
            if (isUserInteractingRef.current) {
                lonRef.current = (onMouseDownMouseXRef.current - event.clientX) * 0.1 + onMouseDownLonRef.current;
                latRef.current = (event.clientY - onMouseDownMouseYRef.current) * 0.1 + onMouseDownLatRef.current;
            }
        };

        const onDocumentMouseUp = () => {
            isUserInteractingRef.current = false;
        };

        const onDocumentMouseWheel = (event) => {
            // Можно добавить zoom, но для панорамы обычно не нужно
            event.preventDefault();
        };

        mountRef.current.addEventListener('mousedown', onDocumentMouseDown, false);
        mountRef.current.addEventListener('mousemove', onDocumentMouseMove, false);
        mountRef.current.addEventListener('mouseup', onDocumentMouseUp, false);
        mountRef.current.addEventListener('wheel', onDocumentMouseWheel, false);

        // Для touch устройств
        const onDocumentTouchStart = (event) => {
            if (event.touches.length === 1) {
                event.preventDefault();
                isUserInteractingRef.current = true;
                onMouseDownMouseXRef.current = event.touches[0].pageX;
                onMouseDownMouseYRef.current = event.touches[0].pageY;
                onMouseDownLonRef.current = lonRef.current;
                onMouseDownLatRef.current = latRef.current;
            }
        };

        const onDocumentTouchMove = (event) => {
            if (event.touches.length === 1 && isUserInteractingRef.current) {
                event.preventDefault();
                lonRef.current = (onMouseDownMouseXRef.current - event.touches[0].pageX) * 0.1 + onMouseDownLonRef.current;
                latRef.current = (event.touches[0].pageY - onMouseDownMouseYRef.current) * 0.1 + onMouseDownLatRef.current;
            }
        };

        const onDocumentTouchEnd = () => {
            isUserInteractingRef.current = false;
        };

        mountRef.current.addEventListener('touchstart', onDocumentTouchStart, false);
        mountRef.current.addEventListener('touchmove', onDocumentTouchMove, false);
        mountRef.current.addEventListener('touchend', onDocumentTouchEnd, false);

        return () => {
            if (mountRef.current) {
                mountRef.current.removeEventListener('mousedown', onDocumentMouseDown);
                mountRef.current.removeEventListener('mousemove', onDocumentMouseMove);
                mountRef.current.removeEventListener('mouseup', onDocumentMouseUp);
                mountRef.current.removeEventListener('wheel', onDocumentMouseWheel);
                mountRef.current.removeEventListener('touchstart', onDocumentTouchStart);
                mountRef.current.removeEventListener('touchmove', onDocumentTouchMove);
                mountRef.current.removeEventListener('touchend', onDocumentTouchEnd);
            }
        };
    }, []);

    // Инициализация
    useEffect(() => {
        // Проверяем настройки WebGL
        const webglInfo = checkWebGLSettings();
        setDebugInfo(webglInfo);

        console.log('Проверка WebGL:', webglInfo);

        // Инициализируем Three.js
        const success = initThreeJS();

        if (!success) {
            return;
        }

        // Настраиваем обработчики событий
        const cleanupListeners = setupEventListeners();

        // Обработчик изменения размера
        const handleResize = () => {
            if (mountRef.current && cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        // Очистка
        return () => {
            if (cleanupListeners) cleanupListeners();

            window.removeEventListener('resize', handleResize);

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }

            if (rendererRef.current && mountRef.current && rendererRef.current.domElement) {
                try {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                } catch (e) {
                    console.warn('Ошибка при удалении canvas:', e);
                }
            }

            // Очищаем Three.js ресурсы
            if (meshRef.current) {
                if (meshRef.current.geometry) meshRef.current.geometry.dispose();
                if (meshRef.current.material) {
                    if (meshRef.current.material.map) meshRef.current.material.map.dispose();
                    meshRef.current.material.dispose();
                }
            }

            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [initThreeJS, setupEventListeners, checkWebGLSettings]);

    // Сброс вида
    const resetView = useCallback(() => {
        lonRef.current = 0;
        latRef.current = 0;
        phiRef.current = 0;
        thetaRef.current = 0;
    }, []);

    return (
        <div className="cylindrical-panorama-overlay" onClick={onClose}>
            <div className="cylindrical-panorama-container" onClick={(e) => e.stopPropagation()}>
                <div className="panorama-header">
                    <h3>Виртуальный тур 360° (3D)</h3>
                    <div className="header-controls">
                        <button className="reset-btn" onClick={resetView}>
                            🔄 Сбросить вид
                        </button>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="panorama-content">
                    {isLoading && (
                        <div className="panorama-loading">
                            <div className="loading-spinner"></div>
                            <p>Инициализация 3D панорамы...</p>
                            <p className="loading-subtext">Загрузка текстур...</p>
                        </div>
                    )}

                    {error && (
                        <div className="panorama-error">
                            <div className="error-icon">⚠️</div>
                            <p className="error-main">{error}</p>
                            <div className="error-solution">
                                <p><strong>Возможные решения:</strong></p>
                                <ol>
                                    <li>Обновите браузер до последней версии</li>
                                    <li>Проверьте поддержку WebGL на <a href="https://get.webgl.org" target="_blank" rel="noopener noreferrer">get.webgl.org</a></li>
                                    <li>Включите аппаратное ускорение в настройках браузера</li>
                                    <li>Убедитесь, что файл панорамы существует: {getPanoramaPath()}</li>
                                </ol>
                            </div>
                            <button
                                className="retry-btn"
                                onClick={() => window.location.reload()}
                            >
                                Перезагрузить страницу
                            </button>
                        </div>
                    )}

                    <div
                        ref={mountRef}
                        className="threejs-container"
                        style={{
                            width: '100%',
                            height: '100%',
                            cursor: isUserInteractingRef.current ? 'grabbing' : 'grab'
                        }}
                    />
                </div>

                <div className="panorama-instructions">
                    <p>🖱️ Перетаскивайте для осмотра помещения в 3D</p>
                    <p>📱 На мобильных устройствах - двигайте пальцем</p>
                    <p>🔄 Панорама автоматически вращается</p>
                </div>

                {/* Отладочная информация */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-panel">
                        <details>
                            <summary>Отладочная информация</summary>
                            <pre>{debugInfo}</pre>
                            <button
                                onClick={() => {
                                    console.log('Отладка Three.js:', {
                                        scene: sceneRef.current,
                                        camera: cameraRef.current,
                                        renderer: rendererRef.current,
                                        mesh: meshRef.current,
                                        mount: mountRef.current
                                    });
                                }}
                                className="debug-btn"
                            >
                                Вывести в консоль
                            </button>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CylindricalPanorama;