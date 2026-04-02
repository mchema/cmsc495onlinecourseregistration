import AppError from '../base/app.error.js';

export default class DuplicateEntryError extends AppError {
    constructor(resource = 'Resource', details = null) {
        const normalizedResource = String(resource).trim();
        const message = /already exists\.?$/i.test(normalizedResource) ? normalizedResource.replace(/\.*$/, '.') : normalizedResource + ' already exists.';

        super(message, {
            code: 'DUPLICATE_ENTRY',
            status: 409,
            details,
        });
    }
}
