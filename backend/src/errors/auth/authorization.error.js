import AppError from '../base/app.error.js';

export default class AuthorizationError extends AppError {
    constructor(message = 'Unauthorized access.', details = null) {
        super(message, {
            code: 'AUTHORIZATION_ERROR',
            status: 403,
            details,
        });
    }
}
