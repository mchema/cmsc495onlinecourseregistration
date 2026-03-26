import AppError from './AppError.js';

export default class SectionError extends AppError {
    constructor(message) {
        super(message, { code: 'SECTION_ERROR' });
    }
}