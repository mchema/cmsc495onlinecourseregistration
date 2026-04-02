import AppError from '../base/app.error.js';

export default class SectionError extends AppError {
    constructor(message = 'Section operation failed.', details = null) {
        super(message, {
            code: 'SECTION_ERROR',
            status: 400,
            details,
        });
    }
}
