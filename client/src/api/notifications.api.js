import client from './client';

export const getNotifications = async (params = {}) => {
  const response = await client.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await client.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await client.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await client.patch('/notifications/read-all');
  return response.data;
};

export const runReminders = async () => {
  const response = await client.post('/notifications/run-reminders');
  return response.data;
};
