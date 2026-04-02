import PrerequisiteError from './prerequisite.error.js';

export default class PrerequisiteCycleError extends PrerequisiteError {
    constructor(courseId, prerequisiteId) {
        super('This prerequisite relationship would create a cycle.', {
            courseId,
            prerequisiteId,
        });
        this.code = 'PREREQUISITE_CYCLE';
        this.status = 409;
        this.statusCode = 409;
    }
}
