import AppError from '../base/app.error.js';

export default class DuplicatePrerequisiteError extends AppError {
    constructor(courseId, prerequisiteId, details = null) {
        super('This prerequisite relationship already exists.', {
            code: 'DUPLICATE_PREREQUISITE',
            status: 409,
            details: {
                courseId,
                prerequisiteId,
                ...(details ?? {}),
            },
        });
    }
}
