import client from './client';

export const getCreditBalance = async () => {
  const response = await client.get('/credits/balance');
  return response.data;
};

export const getCreditTransactions = async (params = {}) => {
  const response = await client.get('/credits/transactions', { params });
  return response.data;
};
