import axios from 'axios';

const API_URL = process.env.API_URL || "http://localhost:8000/api"

// Используется для запросов общей информации. Например 
// publicApi.get('classroms') 
// Сделает GET запрос по адресу http://localhost:8000/api/classrooms/

export const publicApi = axios.create({
    baseURL: API_URL,
    headers : {
        "Content-Type": "application/json"
    },
    timeout: 10
})

// Используется для запросов, требующих права авторизованного пользователя.
// работает аналошично публичному апи, но при возврате ошибки 401 попытается обновить jwt сессию и переотправит запрос
export const privateApi = axios.create({
    baseURL: API_URL,
    headers : {
        "Content-Type": "application/json"
    },
    timeout: 10
})

// как раз таки проверка на авторизацию. Взято из курсача по вэбу
privateApi.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
// Автообновление токена при 401 ошибке
privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и это не запрос на обновление токена
    if (error.response?.status === 401 && !originalRequest._isRetry) {
      originalRequest._isRetry = true;
      
      try {
        // Пытаемся обновить токен
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await publicApi.post('/auth/refresh/', { 
          refresh: refreshToken 
        });
        
        // Сохраняем новый токен
        localStorage.setItem('access_token', response.data.access);
        
        // Повторяем запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return privateApi(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить — разлогиниваем
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        //window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

 