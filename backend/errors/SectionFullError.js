import SectionError from './SectionError.js'

export default class SectionFullError extends SectionError {
    constructor(sectionId) {
        super(`Section ${sectionId} is full`);
    }
}