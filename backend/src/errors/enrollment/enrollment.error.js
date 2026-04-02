import AppError from '../base/app.error.js';

export default class EnrollmentError extends AppError {
    constructor(message = 'Enrollment operation failed.', details = null) {
        super(message, {
            code: 'ENROLLMENT_ERROR',
            status: 400,
            details,
        });
    }
}
