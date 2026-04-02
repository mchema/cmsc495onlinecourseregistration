import EnrollmentError from './enrollment.error.js';

export default class AlreadyEnrolledError extends EnrollmentError {
    constructor(studentId, courseId) {
        super('Student ' + studentId + ' is already enrolled in course ' + courseId + '.', {
            studentId,
            courseId,
        });
        this.code = 'ALREADY_ENROLLED';
        this.status = 409;
        this.statusCode = 409;
    }
}
