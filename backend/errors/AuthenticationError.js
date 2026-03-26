import AppError from './AppError.js'

export default class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, {
            code: 'AUTHENTICATION_ERROR',
            status: 401
        });
    }
}