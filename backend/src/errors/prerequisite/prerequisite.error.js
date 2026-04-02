import AppError from '../base/app.error.js';

export default class PrerequisiteError extends AppError {
    constructor(message = 'Prerequisite operation failed.', details = null) {
        super(message, {
            code: 'PREREQUISITE_ERROR',
            status: 400,
            details,
        });
    }
}
