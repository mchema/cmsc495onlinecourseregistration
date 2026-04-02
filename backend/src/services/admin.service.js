import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';
import User from '../domain/user.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

class AdminService {
    constructor() {}

    async getCurrentRoleForUser(id, connection = null) {
        const runQuery = connection ? (sql, params) => db.queryWithConnection(connection, sql, params) : (sql, params) => db.query(sql, params);

        const existsAdmin = await runQuery('SELECT employee_id, access_level FROM admins WHERE user_id = ?', [id]);
        if (existsAdmin.length > 0) {
            return {
                role: 'ADMIN',
                role_id: existsAdmin[0].employee_id,
                role_details: existsAdmin[0].access_level,
            };
        }

        const existsProfessor = await runQuery('SELECT professor_id, department FROM professors WHERE user_id = ?', [id]);
        if (existsProfessor.length > 0) {
            return {
                role: 'PROFESSOR',
                role_id: existsProfessor[0].professor_id,
                role_details: existsProfessor[0].department,
            };
        }

        const existsStudent = await runQuery('SELECT student_id, major FROM students WHERE user_id = ?', [id]);
        if (existsStudent.length > 0) {
            return {
                role: 'STUDENT',
                role_id: existsStudent[0].student_id,
                role_details: existsStudent[0].major,
            };
        }

        return null;
    }

    async getAdminCount(connection = null) {
        const runQuery = connection ? (sql, params) => db.queryWithConnection(connection, sql, params) : (sql, params) => db.query(sql, params);
        const rows = await runQuery('SELECT COUNT(*) AS count FROM admins', []);
        return rows[0].count;
    }

    // Add New User
    async addUser(name, email, roleDetails, userType) {
        const existingCount = await db.query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]);
        const count = existingCount[0].count;

        if (count > 0) {
            throw new Errors.DuplicateEntryError('User with this email already exists.');
        }

        const passwordString = name + email;
        const password = await bcrypt.hash(passwordString, saltRounds);

        const connection = await db.getConnection();

        try {
            await db.beginTransaction(connection);

            let result;
            try {
                result = await db.queryWithConnection(connection, 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, password]);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    throw new Errors.DuplicateEntryError('User with this email already exists.');
                }
                throw err;
            }

            const newId = result.insertId;

            await this.setUserRole(newId, roleDetails, userType, connection);

            await db.commit(connection);
        } catch (err) {
            await db.rollback(connection);
            throw err;
        } finally {
            db.releaseConnection(connection);
        }
    }

    // Remove User
    async removeUser(id, actingUser = null) {
        const existingCount = await db.query('SELECT COUNT(*) AS count FROM users WHERE user_id = ?', [id]);
        const count = existingCount[0].count;

        if (count === 0) {
            throw new Errors.NotFoundError('User not found.');
        }

        if (actingUser?.id && Number(id) === Number(actingUser.id)) {
            throw new Errors.AuthorizationError('Admins cannot remove their own account.');
        }

        const existingRole = await this.getCurrentRoleForUser(id);
        if (existingRole?.role === 'ADMIN' && (await this.getAdminCount()) <= 1) {
            throw new Errors.AuthorizationError('At least one admin must remain in the system.');
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    }

    // get SQL Query for Inserting Role-Specific Data
    getRoleInsertQuery(userType) {
        const normalizedUserType = String(userType).toLowerCase();

        if (normalizedUserType === 'admin') {
            return {
                sql: 'INSERT INTO admins (user_id, access_level) VALUES (?, ?)',
            };
        }

        if (normalizedUserType === 'professor') {
            return {
                sql: 'INSERT INTO professors (user_id, department) VALUES (?, ?)',
            };
        }

        if (normalizedUserType === 'student') {
            return {
                sql: 'INSERT INTO students (user_id, major) VALUES (?, ?)',
            };
        }

        throw new Errors.ValidationError('Invalid user type.');
    }

    // Set User Type
    async setUserRole(id, roleDetails, userType, connection = null, actingUser = null) {
        const roleInsert = this.getRoleInsertQuery(userType);
        const getConnection = connection ?? (await db.getConnection());
        const ownsTransaction = connection === null;
        const runQuery = (sql, params) => db.queryWithConnection(getConnection, sql, params);

        try {
            if (ownsTransaction) {
                await db.beginTransaction(getConnection);
            }

            const existingCount = await runQuery('SELECT COUNT(*) AS count FROM users WHERE user_id = ?', [id]);

            if (existingCount[0].count === 0) {
                throw new Errors.NotFoundError('User not found.');
            }

            const existingRole = await this.getCurrentRoleForUser(id, getConnection);
            const nextRole = String(userType).toUpperCase();

            if (actingUser?.id && Number(id) === Number(actingUser.id) && existingRole?.role === 'ADMIN' && nextRole !== 'ADMIN') {
                throw new Errors.AuthorizationError('Admins cannot remove their own admin role.');
            }

            if (existingRole?.role === 'ADMIN' && nextRole !== 'ADMIN' && (await this.getAdminCount(getConnection)) <= 1) {
                throw new Errors.AuthorizationError('At least one admin must remain in the system.');
            }

            await runQuery('DELETE FROM admins WHERE user_id = ?', [id]);
            await runQuery('DELETE FROM professors WHERE user_id = ?', [id]);
            await runQuery('DELETE FROM students WHERE user_id = ?', [id]);

            const result = await runQuery(roleInsert.sql, [id, roleDetails]);

            if (ownsTransaction) {
                await db.commit(getConnection);
            }

            return result.insertId;
        } catch (err) {
            if (ownsTransaction) {
                await db.rollback(getConnection);
            }
            throw err;
        } finally {
            if (ownsTransaction) {
                db.releaseConnection(getConnection);
            }
        }
    }

    // Get All Users
    async getAllUsers(page = 1, limit = 10, search = '', role = null) {
        const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
        const offset = (normalizedPage - 1) * normalizedLimit;
        const roleTableMap = {
            ADMIN: 'admins',
            PROFESSOR: 'professors',
            STUDENT: 'students',
        };

        let where = [];
        let params = [];

        if (search) {
            where.push('(name LIKE ? OR email LIKE ?)');
            params.push('%' + search + '%', '%' + search + '%');
        }

        if (role) {
            const normalizedRole = String(role).toUpperCase();
            const roleTable = roleTableMap[normalizedRole];

            if (!roleTable) {
                throw new Errors.ValidationError('Invalid role filter.');
            }

            where.push('user_id IN (SELECT user_id FROM ' + roleTable + ' )');
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const countResult = await db.query('SELECT COUNT(*) AS count FROM users ' + whereClause, params);
        const rows = await db.query('SELECT user_id AS id, name, email, first_login FROM users ' + whereClause + ' ORDER BY name ASC, user_id ASC LIMIT ? OFFSET ?', [...params, normalizedLimit, offset]);
        const users = await Promise.all(
            rows.map(async (row) => {
                const role = await this.getCurrentRoleForUser(row.id);
                return User.fromSafeObject({ ...row, ...(role ?? {}) }).toSafeObject();
            })
        );

        return {
            data: users,
            meta: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: countResult[0].count,
                totalPages: Math.ceil(countResult[0].count / normalizedLimit),
            },
        };
    }

    // Get User by ID
    async getUserByID(id) {
        const rows = await db.query('SELECT user_id AS id, name, email, first_login FROM users WHERE user_id = ?', [id]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('User not found.');
        }

        const role = await this.getCurrentRoleForUser(id);
        const user = User.fromSafeObject({ ...rows[0], ...(role ?? {}) }).toSafeObject();

        return user;
    }
}

export default AdminService;
