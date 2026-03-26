import AppError from './AppError.js';

export default class EnrollmentError extends AppError {
    constructor(message) {
        super(message, { code: 'ENROLLMENT_ERROR' });
    }
}