import client from './client';

export const getItems = async (params = {}) => {
  const response = await client.get('/items', { params });
  return response.data;
};

export const getItemById = async (id) => {
  const response = await client.get(`/items/${id}`);
  return response.data;
};

export const createItem = async (data) => {
  const response = await client.post('/items', data);
  return response.data;
};

export const updateItem = async (id, data) => {
  const response = await client.put(`/items/${id}`, data);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await client.delete(`/items/${id}`);
  return response.data;
};

export const checkItemAvailability = async (id, params) => {
  const response = await client.get(`/items/${id}/availability`, { params });
  return response.data;
};
