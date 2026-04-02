import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';
import Section from '../domain/section.js';
import crypto from 'crypto';

class SectionService {
    constructor() {}

    async getContext(sectionId, actingUser) {
        const rows = await db.query('SELECT section_id, professor_id, access_codes FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        const section = rows[0];

        if (actingUser?.role === 'ADMIN') {
            return section;
        }

        if (actingUser?.role === 'PROFESSOR' && actingUser.role_id === section.professor_id) {
            return section;
        }

        throw new Errors.AuthorizationError('Professors may only manage access codes for their own sections.');
    }

    getHighestIndex(accessCodes) {
        return Object.keys(accessCodes).reduce((max, key) => {
            const match = key.match(/^code(\d+)$/);
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
    }

    // Check Semester Exists
    async semesterExists(semesterId) {
        const rows = await db.query('SELECT semester_id FROM semesters WHERE semester_id = ?', [semesterId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Semester not found.');
        }
    }

    // Check Professor Exists
    async professorExists(professorId) {
        const rows = await db.query('SELECT professor_id FROM professors WHERE professor_id = ?', [professorId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Professor not found.');
        }
    }

    // Get Existing Section Info
    async getSectionInfo(sectionId) {
        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        const section = Section.fromPersistence(rows[0]);
        return section.toSafeObject();
    }

    // Check if Access Code exists and has already been used, and mark it as used if valid
    async useAccessCode(sectionId, code) {
        const rows = await db.query('SELECT access_codes FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        const accessCodes = { ...rows[0].access_codes };
        const matchingKey = Object.keys(accessCodes).find((key) => /^code\d+$/.test(key) && accessCodes[key] === code);

        if (!matchingKey || accessCodes[matchingKey + '_used'] !== false) {
            throw new Errors.ValidationError('Invalid or already used access code.');
        }

        accessCodes[matchingKey + '_used'] = true;
        await db.query('UPDATE sections SET access_codes = ? WHERE section_id = ?', [JSON.stringify(accessCodes), sectionId]);
        return true;
    }

    // Get All Access Codes for a Section
    async getAccessCodes(sectionId, actingUser) {
        const section = await this.getContext(sectionId, actingUser);
        return section.access_codes;
    }

    // Generate More Access Codes for a Section
    async generateAccessCodes(sectionId, numCodes = 3, actingUser) {
        const section = await this.getContext(sectionId, actingUser);
        const existingCodes = section.access_codes;
        const newCodes = {};
        const highestCodeIndex = this.getHighestIndex(existingCodes);

        for (let i = 1; i <= numCodes; i++) {
            const string1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const string2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const code = string1 + '-' + string2;
            const keyName = 'code' + (highestCodeIndex + i);
            const keyNameUsed = keyName + '_used';
            newCodes[keyName] = code;
            newCodes[keyNameUsed] = false;
        }

        const updatedCodes = { ...existingCodes, ...newCodes };
        const updatedCodesString = JSON.stringify(updatedCodes);

        await db.query('UPDATE sections SET access_codes = ? WHERE section_id = ?', [updatedCodesString, sectionId]);

        return newCodes;
    }

    // Revoke Selected Access Codes for a Section
    async revokeAccessCodes(sectionId, codesToRevoke, actingUser) {
        const section = await this.getContext(sectionId, actingUser);
        const existingCodes = section.access_codes;
        const updatedCodes = { ...existingCodes };

        codesToRevoke.forEach((code) => {
            const keyName = Object.keys(updatedCodes).find((key) => updatedCodes[key] === code);
            if (keyName) {
                delete updatedCodes[keyName];
                const keyNameUsed = keyName + '_used';
                delete updatedCodes[keyNameUsed];
            }
        });

        const updatedCodesString = JSON.stringify(updatedCodes);
        await db.query('UPDATE sections SET access_codes = ? WHERE section_id = ?', [updatedCodesString, sectionId]);
    }

    // Get All Sections with Pagination, Search, and Filtering
    async getAllSections(page, limit, search, courseId = null, semesterId = null, professorId = null) {
        const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
        const offset = (normalizedPage - 1) * normalizedLimit;

        let where = [];
        let params = [];

        if (search) {
            where.push('(section_id LIKE ? OR professor_id LIKE ?)');
            params.push('%' + search + '%', '%' + search + '%');
        }

        if (courseId) {
            where.push('course_id = ?');
            params.push(courseId);
        }

        if (semesterId) {
            where.push('semester_id = ?');
            params.push(semesterId);
        }

        if (professorId) {
            where.push('professor_id = ?');
            params.push(professorId);
        }

        const whereClause = where.length > 0 ? ' WHERE ' + where.join(' AND ') : '';
        const countResult = await db.query('SELECT COUNT(*) AS count FROM sections' + whereClause, params);
        const rows = await db.query('SELECT * FROM sections' + whereClause + ' ORDER BY section_id DESC LIMIT ? OFFSET ?', [...params, normalizedLimit, offset]);

        const results = rows.map((row) => Section.fromPersistence(row));

        return {
            data: results.map((section) => section.toSafeObject()),
            meta: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: countResult[0].count,
                totalPages: Math.ceil(countResult[0].count / normalizedLimit),
            },
        };
    }

    async addSection(courseId, semesterId, professorId, capacity, days, start_time, end_time, numCodes = 3) {
        const course = await db.query('SELECT course_id FROM courses WHERE course_id = ?', [courseId]);

        if (course.length === 0) {
            throw new Errors.NotFoundError('Course not found.');
        }

        await this.semesterExists(semesterId);
        await this.professorExists(professorId);

        const access_codes = {};

        for (let i = 1; i <= numCodes; i++) {
            const string1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const string2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const code = string1 + '-' + string2;
            const keyName = 'code' + i;
            const keyNameUsed = keyName + '_used';
            access_codes[keyName] = code;
            access_codes[keyNameUsed] = false;
        }

        const accessCodesString = JSON.stringify(access_codes);

        const result = await db.query('INSERT INTO sections (course_id, semester_id, professor_id, capacity, days, start_time, end_time, access_codes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [courseId, semesterId, professorId, capacity, days || null, start_time || null, end_time || null, accessCodesString]);
        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [result.insertId]);

        if (rows.length === 0) {
            throw new Errors.InternalServerError('Failed to retrieve newly created section.');
        }

        const section = Section.fromPersistence(rows[0]);
        return section.toObject();
    }

    async updateSection(sectionId, updatedData) {
        const { semesterId, professorId, capacity, days, startTime, endTime } = updatedData;
        const existingRows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (existingRows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        await this.semesterExists(semesterId);
        await this.professorExists(professorId);

        const enrolledRows = await db.query('SELECT COUNT(*) AS count FROM enrollments WHERE section_id = ? AND status = ?', [sectionId, 'enrolled']);
        if (Number(enrolledRows[0].count) > Number(capacity)) {
            throw new Errors.ValidationError('Section capacity cannot be set below current enrolled count.');
        }

        const existing = existingRows[0];

        const courseId = existing.course_id;

        await db.query('UPDATE sections SET course_id = ?, semester_id = ?, professor_id = ?, capacity = ?, days = ?, start_time = ?, end_time = ? WHERE section_id = ?', [courseId, semesterId, professorId, capacity, days, startTime ?? null, endTime ?? null, sectionId]);

        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.InternalServerError('Failed to retrieve existing section data.');
        }

        const section = Section.fromPersistence(rows[0]);

        return section.toSafeObject();
    }

    async removeSection(sectionId) {
        const exists = await db.query('SELECT COUNT(*) as count FROM sections WHERE section_id = ?', [sectionId]);

        if (exists[0].count === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        const dependentEnrollments = await db.query('SELECT COUNT(*) AS count FROM enrollments WHERE section_id = ?', [sectionId]);

        if (dependentEnrollments[0].count > 0) {
            throw new Errors.ValidationError('Cannot delete a section that has enrollments. Remove or archive its enrollments first.');
        }

        await db.query('DELETE FROM sections WHERE section_id = ?', [sectionId]);
    }
}

export default SectionService;
