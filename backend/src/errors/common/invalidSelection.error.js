import ValidationError from '../validation/validation.error.js';

export default class InvalidSelectionError extends ValidationError {
    constructor(selection = 'unknown') {
        super('Invalid menu selection: ' + selection + '.');
    }
}
