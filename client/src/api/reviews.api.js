import client from './client';

export const createReview = async (data) => {
  const response = await client.post('/reviews', data);
  return response.data;
};

export const getMyReviews = async (params = {}) => {
  const response = await client.get('/reviews/my', { params });
  return response.data;
};

export const getUserReviews = async (userId, params = {}) => {
  const response = await client.get(`/reviews/user/${userId}`, { params });
  return response.data;
};

export const getLoanReviews = async (loanId) => {
  const response = await client.get(`/reviews/loan/${loanId}`);
  return response.data;
};
