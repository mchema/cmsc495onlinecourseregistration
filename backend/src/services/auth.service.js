/**
 * authService
 *
 * Responsibilities:
 * Handle user calls to the database for authentication and validation.
 * Determine whether a user is still on their first login.
 * Enforce password policy during credential rotation.
 */

import User from '../domain/user.js';
import * as Errors from '../errors/index.js';
import * as bcrypt from 'bcrypt';
import * as db from '../db/connection.js';

const saltRounds = 10;

class AuthService {
    constructor() {}

    // Initialize User
    async loginUser(email, password) {
        const rows = await db.query('SELECT user_id AS id, name, email, password_hash, first_login FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            throw new Errors.AuthenticationError('Invalid email and/or password.');
        }

        const user = User.fromPersistence(rows[0]);

        const passwordCheck = await bcrypt.compare(password, user.getPasswordHash());

        if (passwordCheck === false) {
            throw new Errors.AuthenticationError('Invalid email and/or password.');
        }

        const safeUser = user.withoutPasswordHash();
        const roleUser = await this.getCurrentUserInfo(safeUser.toSafeObject());
        const isFirstLogin = user.getFirstLogin();

        if (isFirstLogin === true) {
            return {
                user: roleUser,
                firstLogin: isFirstLogin,
            };
        }
        return {
            user: roleUser,
            firstLogin: isFirstLogin,
        };
    }

    // Change Password enforces Password Policy, Hashing, and persistence
    async changePassword(authUser = null, password) {
        if (authUser === null) {
            throw new Errors.AuthenticationError('Authentication required.');
        }
        this.validatePasswordPolicy(password, authUser);

        const hash = await bcrypt.hash(password, saltRounds);
        await this.setPassword(authUser.id, hash);
    }

    validatePasswordPolicy(password, user = null) {
        if (!password || typeof password !== 'string') {
            throw new Errors.ValidationError('Password is required.');
        }

        if (password === 'Password') {
            throw new Errors.ValidationError('Password cannot be the default password.');
        }

        if (password.length < 8) {
            throw new Errors.ValidationError('Password must be at least 8 characters long.');
        }

        if (!/[A-Z]/.test(password)) {
            throw new Errors.ValidationError('Password must contain at least one uppercase letter.');
        }

        if (!/[a-z]/.test(password)) {
            throw new Errors.ValidationError('Password must contain at least one lowercase letter.');
        }

        if (!/[0-9]/.test(password)) {
            throw new Errors.ValidationError('Password must contain at least one number.');
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            throw new Errors.ValidationError('Password must contain at least one special character.');
        }

        if (user) {
            const email = user.email?.toLowerCase() ?? '';
            const localPart = email.split('@')[0] ?? '';

            if (localPart && password.toLowerCase().includes(localPart)) {
                throw new Errors.ValidationError('Password cannot contain the email local-part.');
            }
        }
    }

    // Set Password in Database
    async setPassword(id, password) {
        await db.query('UPDATE users SET password_hash = ?, first_login = ? WHERE user_id = ?', [password, false, id]);
    }

    // Get User Type
    async updateUserType(user) {
        const id = user.getUserID();

        const existsStudent = await db.query('SELECT student_id, major FROM students WHERE user_id = ?', [id]);
        const existsProfessor = await db.query('SELECT professor_id, department FROM professors WHERE user_id = ?', [id]);
        const existsAdmin = await db.query('SELECT employee_id, access_level FROM admins WHERE user_id = ?', [id]);

        if (existsAdmin.length > 0) {
            return { role: 'ADMIN', role_id: existsAdmin[0].employee_id, role_details: existsAdmin[0].access_level };
        }

        if (existsProfessor.length > 0) {
            return { role: 'PROFESSOR', role_id: existsProfessor[0].professor_id, role_details: existsProfessor[0].department };
        }

        if (existsStudent.length > 0) {
            return { role: 'STUDENT', role_id: existsStudent[0].student_id, role_details: existsStudent[0].major };
        }

        throw new Errors.NotFoundError('User does not have an assigned role type.');
    }

    async getCurrentUserInfo(authUser) {
        if (!authUser) {
            throw new Errors.AuthenticationError('Authentication required.');
        }

        const rows = await db.query('SELECT user_id AS id, name, email, password_hash, first_login FROM users WHERE user_id = ?', [authUser.id]);
        const user = User.fromPersistence(rows[0]);

        const roleRows = await this.updateUserType(user);
        const roleUser = user.withRole(roleRows).withoutPasswordHash();

        return roleUser;
    }

    async updateUserInfo(name, email, id) {
        const existingRows = await db.query('SELECT COUNT(*) AS count FROM users WHERE email = ? AND user_id <> ?', [email, id]);

        if (existingRows[0].count > 0) {
            throw new Errors.DuplicateEntryError('User with this email already exists.');
        }

        await db.query('UPDATE users SET name = ?, email = ? WHERE user_id = ?', [name, email, id]);

        return this.getCurrentUserInfo({ id });
    }
}

export default AuthService;
