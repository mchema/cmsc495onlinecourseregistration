import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';
import Section from '../domain/section.js';

class SectionService {
    constructor() {}

    async ensureSemesterExists(semesterId) {
        const rows = await db.query('SELECT semester_id FROM semesters WHERE semester_id = ?', [semesterId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Semester not found.');
        }
    }

    async ensureProfessorExists(professorId) {
        const rows = await db.query('SELECT professor_id FROM professors WHERE professor_id = ?', [professorId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Professor not found.');
        }
    }

    async getSectionInfo(sectionId) {
        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        return Section.fromPersistence(rows[0]);
    }

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
        const rows = await db.query('SELECT * FROM sections' + whereClause + ' ORDER BY section_id ASC LIMIT ? OFFSET ?', [...params, normalizedLimit, offset]);

        const results = rows.map((row) => Section.fromPersistence(row));

        return {
            data: results.map((section) => section.toObject()),
            meta: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: countResult[0].count,
                totalPages: Math.ceil(countResult[0].count / normalizedLimit),
            },
        };
    }

    async addSection(courseId, semesterId, professorId, capacity, days, start_time, end_time) {
        const course = await db.query('SELECT course_id FROM courses WHERE course_id = ?', [courseId]);

        if (course.length === 0) {
            throw new Errors.NotFoundError('Course not found.');
        }

        await this.ensureSemesterExists(semesterId);
        await this.ensureProfessorExists(professorId);

        const result = await db.query('INSERT INTO sections (course_id, semester_id, professor_id, capacity, days, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)', [course[0].course_id, semesterId, professorId, capacity, days || null, start_time, end_time]);
        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [result.insertId]);

        if (rows.length === 0) {
            throw new Errors.InternalServerError('Failed to retrieve newly created section.');
        }

        return Section.fromPersistence(rows[0]);
    }

    async updateSection(sectionId, updatedData) {
        const { semesterId, professorId, capacity, days, startTime, endTime } = updatedData;
        const existingRows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (existingRows.length === 0) {
            throw new Errors.NotFoundError('Section not found.');
        }

        await this.ensureSemesterExists(semesterId);
        await this.ensureProfessorExists(professorId);

        const existing = existingRows[0];

        await db.query('UPDATE sections SET course_id = ?, semester_id = ?, professor_id = ?, capacity = ?, days = ?, start_time = ?, end_time = ? WHERE section_id = ?', [existing.course_id, semesterId, professorId, capacity, days, startTime ?? null, endTime ?? null, sectionId]);

        const rows = await db.query('SELECT * FROM sections WHERE section_id = ?', [sectionId]);

        if (rows.length === 0) {
            throw new Errors.InternalServerError('Failed to retrieve existing section data.');
        }

        return Section.fromPersistence(rows[0]);
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
