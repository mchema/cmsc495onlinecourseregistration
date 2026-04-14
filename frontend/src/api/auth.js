import client from './client.js';

export async function loginUser(credentials) {
  const { data } = await client.post('/user/login', credentials);
  return data;
}

export async function getCurrentUser() {
  const { data } = await client.get('/user/me');
  return data;
}

export async function logoutUser() {
  const { data } = await client.get('/user/logout');
  return data;
}

export async function changePassword(password) {
  const { data } = await client.patch('/user/me', { password });
  return data;
}

export async function updateCurrentUser(payload) {
  const { data } = await client.put('/user/me', payload);
  return data;
}