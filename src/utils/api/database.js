import { publicApi,privateApi } from './axios.js';


export const getObject = async (model_name, filters = {}) => {
  const response = await publicApi.post('/database/read/', {
    model: model_name,
    fields: filters,
  });
  return response.data;
};
