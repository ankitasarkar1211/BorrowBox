import client from './client';

export const registerUser = async (data) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await client.post('/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};
