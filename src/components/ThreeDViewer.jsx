// src/components/ThreeDViewer.jsx - ЧИСТАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { TextureLoader } from 'three';
import './ThreeDViewer.css';

const ThreeDViewer = ({ floor = 1 }) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const modelRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const originalMaterialsRef = useRef(new Map());

    const [rotationSpeed] = useState(0);
    const [autoRotate] = useState(false);
    const [scale, setScale] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modelInfo, setModelInfo] = useState({
        name: '',
        size: '',
        vertices: 0,
        polygons: 0,
        memory: '0 KB'
    });

    // Сохраняем начальную позицию камеры для сброса
    const initialCameraPositionRef = useRef(null);
    const initialCameraTargetRef = useRef(null);

    // Инициализация Three.js
    const initThree = useCallback(() => {
        if (!containerRef.current) return;

        // Создаем сцену
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Создаем камеру
        const camera = new THREE.PerspectiveCamera(
            4,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            5000
        );

        // НАЧАЛЬНАЯ ПОЗИЦИЯ КАМЕРЫ с поворотом на 45 градусов против часовой стрелки
        const initialDistance = 70; // Начальное расстояние
        const angle = -Math.PI / 2; // -45 градусов (против часовой стрелки)

        // Вычисляем позицию камеры с учетом угла
        const x = initialDistance * Math.cos(angle);
        const z = initialDistance * Math.sin(angle);
        const y = initialDistance * 0.7;

        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Сохраняем начальную позицию для сброса
        initialCameraPositionRef.current = camera.position.clone();
        initialCameraTargetRef.current = new THREE.Vector3(0, 0, 0);

        // Создаем рендерер
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
        );
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        rendererRef.current = renderer;

        // Добавляем рендерер в контейнер
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        // Создаем OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 200;
        controls.maxPolarAngle = Math.PI;
        controls.target.copy(initialCameraTargetRef.current);
        controls.update();
        controlsRef.current = controls;

        // Добавляем освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
        hemisphereLight.position.set(0, 50, 0);
        scene.add(hemisphereLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(-50, 50, -50);
        scene.add(pointLight);

        // Загружаем модель
        loadModel(scene, floor);

        // Анимация
        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);

            if (modelRef.current && autoRotate) {
                modelRef.current.rotation.y += rotationSpeed * 0.01;
            }

            if (modelRef.current && rotationSpeed > 0 && !autoRotate) {
                modelRef.current.rotation.y += rotationSpeed * 0.01;
            }

            if (controls) controls.update();
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        };

        animate();

        // Обработка изменения размера окна
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer) return;

            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(
                containerRef.current.clientWidth,
                containerRef.current.clientHeight
            );
        };

        window.addEventListener('resize', handleResize);

        // Очистка
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            if (renderer) {
                renderer.dispose();
            }
        };
    }, [floor, rotationSpeed, autoRotate]);

    // Функция для проверки структуры модели
    const inspectModel = useCallback((model) => {
        let meshCount = 0;
        let vertexCount = 0;
        let hasGeometry = false;

        model.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                if (child.geometry) {
                    hasGeometry = true;
                    if (child.geometry.attributes && child.geometry.attributes.position) {
                        vertexCount += child.geometry.attributes.position.count;
                    }
                }
            }
        });

        return { meshCount, vertexCount, hasGeometry };
    }, []);

    // Загрузка модели
    const loadModel = useCallback(async (scene, floorNum) => {
        setIsLoading(true);
        setError(null);

        try {
            const modelFolder = `${floorNum}floor`;
            const modelPath = `../src/assets/models/${floorNum}floor/`;

            // Создаем загрузчики
            const mtlLoader = new MTLLoader();
            const objLoader = new OBJLoader();
            const textureLoader = new TextureLoader();

            // Настраиваем пути
            mtlLoader.setPath(modelPath);
            objLoader.setPath(modelPath);
            textureLoader.setPath(modelPath + '/');

            // Загружаем MTL материалы если есть
            let materials = null;
            try {
                materials = await new Promise((resolve) => {
                    mtlLoader.load(
                        `${modelFolder}.mtl`,
                        (loadedMaterials) => {
                            loadedMaterials.preload();
                            resolve(loadedMaterials);
                        },
                        undefined,
                        () => resolve(null)
                    );
                });
            } catch (mtlError) {
                materials = null;
            }

            if (materials) {
                objLoader.setMaterials(materials);
            }

            // Загружаем OBJ модель
            const model = await new Promise((resolve, reject) => {
                objLoader.load(
                    `${modelFolder}.obj`,
                    (object) => resolve(object),
                    undefined,
                    (error) => reject(error)
                );
            });

            // Удаляем старую модель если есть
            if (modelRef.current) {
                scene.remove(modelRef.current);
                modelRef.current.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }

            modelRef.current = model;

            // Анализируем модель
            const modelInfo = inspectModel(model);
            if (!modelInfo.hasGeometry || modelInfo.vertexCount === 0) {
                throw new Error('Модель не содержит геометрии или вершин');
            }

            // Вычисляем bounding box
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Центрируем модель
            model.position.set(center.x, center.y, -3);
            model.position.sub(center);

            // Масштабируем для удобного просмотра
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scaleValue = maxDimension > 0 ? 15 / maxDimension : 1;
            model.scale.setScalar(scaleValue);
            setScale(scaleValue);

            // Настраиваем материалы
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.material) {
                        originalMaterialsRef.current.set(child.uuid, child.material);

                        if (!child.material.map && !child.material.color) {
                            child.material = new THREE.MeshPhongMaterial({
                                color: 0x808080,
                                shininess: 30,
                                specular: 0x222222
                            });
                        }
                    } else {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0x808080,
                            shininess: 30,
                            specular: 0x222222
                        });
                    }
                }
            });

            // Добавляем модель на сцену
            scene.add(model);

            // Обновляем информацию о модели
            setModelInfo({
                name: `Этаж ${floorNum}`,
                size: `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`,
                vertices: modelInfo.vertexCount,
                polygons: Math.floor(modelInfo.vertexCount / 3),
                memory: `${Math.round(modelInfo.vertexCount * 3 * 4 / 1024)} KB`
            });

            setIsLoading(false);

        } catch (err) {
            console.error('Ошибка загрузки модели:', err);
            setError(`Не удалось загрузить модель для этажа ${floorNum}`);
            setIsLoading(false);

            // Создаем тестовый куб для проверки рендеринга
            const geometry = new THREE.BoxGeometry(10, 10, 10);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 0, 0);
            scene.add(cube);
            modelRef.current = cube;
        }
    }, [inspectModel]);

    // Обработчики событий
    const handleResetView = useCallback(() => {
        if (cameraRef.current && controlsRef.current && initialCameraPositionRef.current) {
            // Плавная анимация возврата к начальной позиции
            cameraRef.current.position.copy(initialCameraPositionRef.current);
            controlsRef.current.target.copy(initialCameraTargetRef.current);
            controlsRef.current.update();

            // Также сбрасываем вращение модели если она вращалась
            if (modelRef.current) {
                modelRef.current.rotation.set(0, 0, 0);
            }
        }
    }, []);

    // Инициализация при монтировании
    useEffect(() => {
        const cleanup = initThree();
        return cleanup;
    }, [initThree]);

    // Обновление модели при смене этажа
    useEffect(() => {
        if (sceneRef.current) {
            loadModel(sceneRef.current, floor);
        }
    }, [floor, loadModel]);

    return (
        <div className="three-viewer-container">
            <div className="three-viewer-main">
                <div className="three-model-viewer">
                    <div
                        ref={containerRef}
                        className="three-model-container"
                        onMouseDown={() => containerRef.current?.classList.add('grabbing')}
                        onMouseUp={() => containerRef.current?.classList.remove('grabbing')}
                    />

                    {isLoading && (
                        <div className="three-loading-overlay">
                            <div className="three-spinner"></div>
                            <h2>Загрузка 3D модели этажа {floor}...</h2>
                            <p>Пожалуйста, подождите</p>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="three-error-message">
                            <i className="fas fa-exclamation-triangle fa-3x"></i>
                            <h2>Ошибка загрузки</h2>
                            <p>{error}</p>
                            <button
                                onClick={() => loadModel(sceneRef.current, floor)}
                                className="three-btn three-btn-primary"
                                style={{marginTop: '15px'}}
                            >
                                <i className="fas fa-redo"></i> Попробовать снова
                            </button>
                        </div>
                    )}
                </div>

                <div className="three-instructions">
                    <h3><i className="fas fa-mouse-pointer"></i> Управление 3D моделью:</h3>
                    <ul>
                        <li>
                            <strong>
                                ЛКМ + перемещение - вращение камеры<br/>
                                ПКМ + перемещение - перемещение камеры<br/>
                                Колесо мыши - увеличение/уменьшение
                            </strong>
                        </li>
                    </ul>
                </div>

                <div className="three-controls">
                    <div className="three-button-group">
                        <button
                            onClick={handleResetView}
                            className="three-btn three-btn-primary"
                        >
                            <i className="fas fa-home"></i> Сбросить вид
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThreeDViewer;