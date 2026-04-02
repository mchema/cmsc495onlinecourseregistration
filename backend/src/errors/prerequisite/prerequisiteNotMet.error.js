import EnrollmentError from '../enrollment/enrollment.error.js';

export default class PrerequisiteNotMetError extends EnrollmentError {
    constructor(courseId, missingPrerequisites = []) {
        super('Prerequisites not met for course ' + courseId + '.', {
            courseId,
            missingPrerequisites,
        });
        this.code = 'PREREQUISITE_NOT_MET';
        this.status = 409;
        this.statusCode = 409;
    }
}
