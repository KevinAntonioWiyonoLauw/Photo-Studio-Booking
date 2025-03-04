// src/services/packageService.js
import api from './api';

export const getAllPackages = async () => {
  const response = await api.get('/packages');
  return response.data;
};

export const getPackageById = async (id) => {
  const response = await api.get(`/packages/${id}`);
  return response.data;
};

export const getPackagesByStudio = async (studioId) => {
  const response = await api.get(`/packages?studioId=${studioId}`);
  return response.data;
};