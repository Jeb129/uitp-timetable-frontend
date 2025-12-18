import {privateApi, publicApi} from './axios.js';

export const register = async (email, password) => {
  const response = await publicApi.post('/auth/register', { email, password });
  return response.data;
};
export const login = async (email, password) => {
  const response = await publicApi.post('/auth/access', { email, password });
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  return response.data;
};
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.reload();
};

export const verifyToken = async () => {
  return await privateApi.post('/auth/verify/', {
    token: localStorage.getItem('access_token'),
  });
};