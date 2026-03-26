import ValidationError from './ValidationError.js';

export default class InvalidCourseDataError extends ValidationError {
    constructor(details) {
        super('Invalid course data', details);
    }
}