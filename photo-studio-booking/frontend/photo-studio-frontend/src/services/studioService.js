// src/services/studioService.js
import api from './api';

export const getAllStudios = async () => {
  const response = await api.get('/studios');
  return response.data;
};

export const getStudioById = async (id) => {
  const response = await api.get(`/studios/${id}`);
  return response.data;
};