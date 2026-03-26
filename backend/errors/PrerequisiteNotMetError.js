import EnrollmentError from './EnrollmentError.js';

export default class PrerequisiteNotMetError extends EnrollmentError {
    constructor(courseId) {
        super(`Prerequisites not met for course ${courseId}`);
    }
}