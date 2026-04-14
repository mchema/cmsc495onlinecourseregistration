import { getUsers } from './admin.js';

export async function getProfessors() {
  const data = await getUsers({ page: 1, limit: 100, role: 'PROFESSOR' });
  return data;
}