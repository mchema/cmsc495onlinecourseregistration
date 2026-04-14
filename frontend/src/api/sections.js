import client from './client.js';

export async function getSections(params = {}) {
  const { data } = await client.get('/section', { params });
  return data;
}

export async function getSectionById(id) {
  const { data } = await client.get(`/section/${id}`);
  return data;
}

export async function createSection(courseId, payload) {
  const { data } = await client.post(`/section/${courseId}`, payload);
  return data;
}

export async function updateSection(id, payload) {
  const { data } = await client.put(`/section/${id}`, payload);
  return data;
}

export async function deleteSection(id) {
  const { data } = await client.delete(`/section/${id}`);
  return data;
}