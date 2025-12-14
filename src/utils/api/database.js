import { publicApi,privateApi } from './apiClient';


export const getObject = async (model_name, filters = {}) => {
  const response = await publicApi.post('/database/read/', {
    model: model_name,
    fields: filters,
  });
  return response.data;
};

export const getObjectMeta = async (model_name) => {
  const response = await publicApi.get(`/database/meta/${model_name}/`);
  return response.data;
} 
export const createObject = async (model_name, fields = {}) => {
  const response = await privateApi.post('/database/create/', {
    model: model_name,
    fields: fields,
  });
  return response.data;
};