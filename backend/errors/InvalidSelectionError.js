import ValidationError from './ValidationError.js';

export default class InvalidSelectionError extends ValidationError {
    constructor(selection) {
        super(`Invalid menu selection: ${selection}`);
    }
}