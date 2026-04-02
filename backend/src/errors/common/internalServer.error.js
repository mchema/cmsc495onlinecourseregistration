import AppError from '../base/app.error.js';

export default class InternalServerError extends AppError {
    constructor(message = 'Internal server error.', details = null) {
        super(message, {
            code: 'INTERNAL_SERVER_ERROR',
            status: 500,
            details,
        });
    }
}
