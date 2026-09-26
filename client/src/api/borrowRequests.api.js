import client from './client';

export const createBorrowRequest = async (data) => {
  const response = await client.post('/borrow-requests', data);
  return response.data;
};

export const getMyBorrowRequests = async (params = {}) => {
  const response = await client.get('/borrow-requests/my', { params });
  return response.data;
};

export const getReceivedBorrowRequests = async (params = {}) => {
  const response = await client.get('/borrow-requests/received', { params });
  return response.data;
};

export const getBorrowRequestById = async (id) => {
  const response = await client.get(`/borrow-requests/${id}`);
  return response.data;
};

export const approveBorrowRequest = async (id) => {
  const response = await client.patch(`/borrow-requests/${id}/approve`);
  return response.data;
};

export const rejectBorrowRequest = async (id, data) => {
  const response = await client.patch(`/borrow-requests/${id}/reject`, data);
  return response.data;
};

export const cancelBorrowRequest = async (id) => {
  const response = await client.patch(`/borrow-requests/${id}/cancel`);
  return response.data;
};
