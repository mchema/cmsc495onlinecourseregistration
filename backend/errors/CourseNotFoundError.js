import NotFoundError from './NotFoundError.js'

export default class CourseNotFoundError extends NotFoundError {
    constructor(courseCode) {
        super(`Course (${courseCode})`);
    }
}