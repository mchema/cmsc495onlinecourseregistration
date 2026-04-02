import SectionError from './section.error.js';

export default class SectionFullError extends SectionError {
    constructor(sectionId) {
        super('Section ' + sectionId + ' is full.', { sectionId });
        this.code = 'SECTION_FULL';
        this.status = 409;
        this.statusCode = 409;
    }
}
