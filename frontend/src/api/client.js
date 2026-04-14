import axios from 'axios';
/*
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
*/


/* v.2 this switches the current setup from token to session 
the browser sends the session cookie automatically
you do not depend on localStorage token storage
auth state is determined by the backend session, not stale frontend storage
import axios from 'axios';
*/

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default client;