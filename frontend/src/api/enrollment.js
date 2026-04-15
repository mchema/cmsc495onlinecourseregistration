import client from './client.js';

export async function listEnrollments(params = {}) {
  const { data } = await client.get('/enrollment', { params });
  return data;
}

export async function createEnrollment(payload) {
  const { data } = await client.post('/enrollment', payload);
  return data;
}

export async function getEnrollmentById(id) {
  const { data } = await client.get(`/enrollment/${id}`);
  return data;
}

export async function updateEnrollment(id, payload) {
  const { data } = await client.put(`/enrollment/${id}`, payload);
  return data;
}

export async function deleteEnrollment(id) {
  const { data } = await client.delete(`/enrollment/${id}`);
  return data;
}