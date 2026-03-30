import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';
import User from '../domain/user.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

class AdminService {
    constructor() {}

    // Add New User
    async addUser(name, email, roleDetails, userType) {
        const existingCount = await db.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]);
        const count = existingCount[0].count;

        if (count > 0) {
            throw new Errors.DuplicateEntryError('User with this email already exists.');
        }

        const passwordString = name + email;
        const password = await bcrypt.hash(passwordString, saltRounds);

        const result = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, password]);

        const newId = result.insertId;

        await this.setUserRole(newId, roleDetails, userType);
    }

    // Remove User
    async removeUser(id) {
        const existingCount = await db.query('SELECT COUNT(*) AS count FROM users WHERE user_id = ?', [id]);
        const count = existingCount[0].count;

        if (count === 0) {
            throw new Errors.NotFoundError('User not found.');
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    }

    // Set User Type
    async setUserRole(id, roleDetails, userType) {
        const normalizedUserType = String(userType).toLowerCase();

        if (normalizedUserType === 'admin') {
            const exists = await db.query('SELECT * FROM admins WHERE user_id = ?', [id]);

            if (exists.length > 0) {
                throw new Errors.DuplicateEntryError('User is already an admin.');
            }

            const result = await db.query('INSERT INTO admins (user_id, access_level) VALUES (?, ?)', [id, roleDetails]);
            return result.insertId;
        } else if (normalizedUserType === 'professor') {
            const exists = await db.query('SELECT * FROM professors WHERE user_id = ?', [id]);

            if (exists.length > 0) {
                throw new Errors.DuplicateEntryError('User is already a professor.');
            }

            const result = await db.query('INSERT INTO professors (user_id, department) VALUES (?, ?)', [id, roleDetails]);
            return result.insertId;
        } else if (normalizedUserType === 'student') {
            const existingCount = await db.query('SELECT COUNT(*) AS count FROM students WHERE user_id = ?', [id]);
            const count = existingCount[0].count;

            if (count > 0) {
                throw new Errors.DuplicateEntryError('User is already a student.');
            }

            const result = await db.query('INSERT INTO students (user_id, major) VALUES (?, ?)', [id, roleDetails]);
            return result.insertId;
        } else {
            throw new Errors.ValidationError('Invalid user type.');
        }
    }

    // Get All Users
    async getAllUsers() {
        const users = await db.query('SELECT user_id, name, email FROM users', []);

        return users;
    }

    // Get User by ID
    async getUserById(user_id) {
        const users = await db.query('SELECT user_id, name, email FROM users WHERE user_id = ?', [user_id]);

        if (users.length === 0) {
            throw new Errors.NotFoundError('User not found.');
        }

        return users[0];
    }

    // Get User by Email
    async getUserByEmail(email) {
        const user = new User();
        await user.initByEmail(email);

        return user.getSafeUserInfo();
    }
}

export default AdminService;
