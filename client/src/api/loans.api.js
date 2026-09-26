import client from './client';

export const getMyLoans = async (params = {}) => {
  const response = await client.get('/loans/my', { params });
  return response.data;
};

export const getLendingLoans = async (params = {}) => {
  const response = await client.get('/loans/lending', { params });
  return response.data;
};

export const getLoanById = async (id) => {
  const response = await client.get(`/loans/${id}`);
  return response.data;
};

export const returnLoan = async (id) => {
  const response = await client.patch(`/loans/${id}/return`);
  return response.data;
};
