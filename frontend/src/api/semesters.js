import client from './client.js';

export async function getSemesters() {
  const { data } = await client.get('/semester');
  return data;
}