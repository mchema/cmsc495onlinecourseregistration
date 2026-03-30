export const BASE_URL = process.env.API_TEST_BASE_URL || 'http://127.0.0.1:3000';
export const SERVER_ENTRY = process.env.API_TEST_SERVER_ENTRY || './backend/src/server.js';
export const SERVER_READY_TIMEOUT_MS = Number(process.env.API_TEST_READY_TIMEOUT_MS || 30000);
export const RUN_COURSE_SUITE = process.env.API_TEST_RUN_COURSES || 'auto';

export const ADMIN_USER = {
    email: process.env.API_TEST_ADMIN_EMAIL || 'horne_chri87@gmail.com',
    password: process.env.API_TEST_ADMIN_PASSWORD || 'R@k4RGAd9j9CcV@rfvCzX3CeLZo-',
};
