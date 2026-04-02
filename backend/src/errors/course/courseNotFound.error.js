import NotFoundError from '../common/notFound.error.js';

export default class CourseNotFoundError extends NotFoundError {
    constructor(courseIdentifier = null, details = null) {
        if (typeof courseIdentifier === 'string' && /not found/i.test(courseIdentifier)) {
            super(courseIdentifier, details);
            return;
        }

        const resource = courseIdentifier ? 'Course (' + courseIdentifier + ')' : 'Course';
        super(resource, details);
    }
}
