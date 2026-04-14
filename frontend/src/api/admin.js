import client from './client.js';

export async function getUsers(params = {}) {
  const { data } = await client.get('/admin', { params });
  return data;
}

export async function getUserById(id) {
  const { data } = await client.get(`/admin/${id}`);
  return data;
}

export async function createUser(payload) {
  const { data } = await client.post('/admin', payload);
  return data;
}

export async function updateUserRole(id, payload) {
  const { data } = await client.put(`/admin/${id}/role`, payload);
  return data;
}

export async function deleteUser(id) {
  const { data } = await client.delete(`/admin/${id}`);
  return data;
}