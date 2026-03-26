import EnrollmentError from './EnrollmentError.js'

export default class AlreadyEnrolledError extends EnrollmentError {
    constructor(studentId, courseId) {
        super(`Student ${studentId} already enrolled in course ${courseId}`);
    }
}
