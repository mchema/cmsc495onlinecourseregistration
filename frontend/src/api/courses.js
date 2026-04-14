import client from './client.js';

export async function getCourses(params = {}) {
  const { data } = await client.get('/course', { params });
  return data;
}

export async function getCourseById(id) {
  const { data } = await client.get(`/course/${id}`);
  return data;
}

export async function createCourse(payload) {
  const { data } = await client.post('/course', payload);
  return data;
}

export async function updateCourse(id, payload) {
  const { data } = await client.put(`/course/${id}`, payload);
  return data;
}

export async function deleteCourse(id) {
  const { data } = await client.delete(`/course/${id}`);
  return data;
}