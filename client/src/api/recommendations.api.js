import client from './client';

export const getRecommendation = async (data) => {
  const response = await client.post('/recommendations', data);
  return response.data;
};
