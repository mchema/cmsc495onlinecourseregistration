import AppError from '../base/app.error.js';

export default class CourseError extends AppError {
    constructor(message = 'Course operation failed.', details = null) {
        super(message, {
            code: 'COURSE_ERROR',
            status: 400,
            details,
        });
    }
}
