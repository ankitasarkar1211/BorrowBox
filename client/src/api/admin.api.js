import client from './client';

export const getAdminStats = async () => {
  const response = await client.get('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await client.get('/admin/users', { params });
  return response.data;
};

export const getAdminUserById = async (id) => {
  const response = await client.get(`/admin/users/${id}`);
  return response.data;
};

export const updateAdminUserStatus = async (id, isActive) => {
  const response = await client.patch(`/admin/users/${id}/status`, { isActive });
  return response.data;
};

export const getAdminItems = async (params = {}) => {
  const response = await client.get('/admin/items', { params });
  return response.data;
};

export const deleteAdminItem = async (id) => {
  const response = await client.delete(`/admin/items/${id}`);
  return response.data;
};
