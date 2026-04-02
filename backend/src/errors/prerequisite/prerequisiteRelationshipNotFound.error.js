import NotFoundError from '../common/notFound.error.js';

export default class PrerequisiteRelationshipNotFoundError extends NotFoundError {
    constructor(courseId, prerequisiteId, details = null) {
        super('Prerequisite relationship', {
            courseId,
            prerequisiteId,
            ...(details ?? {}),
        });
    }
}
