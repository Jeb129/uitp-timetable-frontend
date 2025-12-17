import axios from 'axios';

// ИСПРАВЛЕНИЕ 1:
// Если вы используете Vite, то process.env недоступен. Нужно использовать import.meta.env.
// Также, судя по вашему Python коду, пути начинаются сразу с /auth, а не /api/auth.
// Поэтому я убрал /api из базового URL. Если у вас на бэке есть префикс /api, верните его.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Используется для запросов общей информации.
export const publicApi = axios.create({
    baseURL: API_URL,
    headers : {
        "Content-Type": "application/json"
    },
    // ИСПРАВЛЕНИЕ 2: Таймаут в миллисекундах. 10 мс — это мгновенная ошибка. Ставим 10 секунд.
    timeout: 10000
})

// Используется для запросов, требующих права авторизованного пользователя.
export const privateApi = axios.create({
    baseURL: API_URL,
    headers : {
        "Content-Type": "application/json"
    },
    timeout: 10000
})

// Интерцептор запроса: добавляем токен
privateApi.interceptors.request.use(async (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// Интерцептор ответа: обновление токена
privateApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 и это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                // Запрос на обновление токена
                const response = await publicApi.post('/auth/refresh/', {
                    refresh: refreshToken
                });

                // Сохраняем новый токен
                localStorage.setItem('access_token', response.data.access);

                // Обновляем заголовок в старом запросе и повторяем его
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                return privateApi(originalRequest);

            } catch (refreshError) {
                // Если обновить не удалось — чистим сторадж и редиректим на логин
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login'; // Принудительный редирект
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);