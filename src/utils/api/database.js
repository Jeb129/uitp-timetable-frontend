import { publicApi,privateApi } from './axios';


export const getObject = async (model_name, filters = {}) => {
  const response = await publicApi.post(`/database/get/${model_name}`, filters);
  return response.data;
};

export const updateObject = async (model_name, data = {}) => {
  const response = await privateApi.post(`/database/update/${model_name}`, data);
  return response.data;
};