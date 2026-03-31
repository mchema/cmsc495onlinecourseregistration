/**
 * CourseService
 *
 * Responsibilities:
 * Retrieve course catalog data
 * Retrieve sections for a given course
 * Support simple filtering by semester
 */

import * as db from '../db/connection.js';
import Course from '../domain/course.js';
import * as Errors from '../errors/index.js';
import { getSubjectNameFromCourseCode } from '../utils/courseSubjects.js';

class CourseService {
    constructor() {}

    async getCourseInfo(courseId) {
        const rows = await db.query('SELECT course_id, course_code, title, description, credits FROM courses WHERE course_id = ?', [courseId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Course not found.');
        }

        return Course.fromPersistence(rows[0]);
    }

    async addNewCourse(courseData) {
        const { course_code, title, description, credits } = courseData;

        const existing = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_code = ?', [course_code]);

        if (existing[0].count > 0) {
            throw new Errors.DuplicateEntryError('Course with this course code already exists.');
        }

        const result = await db.query('INSERT INTO courses (course_code, title, description, credits) VALUES (?, ?, ?, ?)', [course_code, title, description, credits]);

        const rows = await db.query('SELECT course_id, course_code, title, description, credits FROM courses WHERE course_id = ?', [result.insertId]);

        if (rows.length === 0) {
            throw new Errors.DatabaseError('Failed to retrieve newly created course.');
        }

        return Course.fromPersistence(rows[0]);
    }

    async updateCourse(courseId, courseData) {
        const { course_code, title, description, credits } = courseData;

        const existing = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_id = ?', [courseId]);

        if (existing[0].count === 0) {
            throw new Errors.NotFoundError('Course not found.');
        }

        const duplicate = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_code = ? AND course_id <> ?', [course_code, courseId]);

        if (duplicate[0].count > 0) {
            throw new Errors.DuplicateEntryError('Course with this course code already exists.');
        }

        await db.query('UPDATE courses SET course_code = ?, title = ?, description = ?, credits = ? WHERE course_id = ?', [course_code, title, description, credits, courseId]);

        const rows = await db.query('SELECT course_id, course_code, title, description, credits FROM courses WHERE course_id = ?', [courseId]);

        if (rows.length === 0) {
            throw new Errors.DatabaseError('Failed to retrieve updated course.');
        }

        return Course.fromPersistence(rows[0]);
    }

    async removeCourse(courseId) {
        const existing = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_id = ?', [courseId]);

        if (existing[0].count === 0) {
            throw new Errors.NotFoundError('Course not found.');
        }

        const dependentSections = await db.query('SELECT COUNT(*) AS count FROM sections WHERE course_id = ?', [courseId]);

        if (dependentSections[0].count > 0) {
            throw new Errors.ValidationError('Cannot delete a course that has scheduled sections. Remove or archive its sections first.');
        }

        await db.query('DELETE FROM courses WHERE course_id = ?', [courseId]);
    }

    async getAllCourses(page, limit, search, subject) {
        const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : 10;
        const offset = (normalizedPage - 1) * normalizedLimit;

        let where = [];
        let params = [];

        if (search) {
            where.push('(course_code LIKE ? OR title LIKE ? OR description LIKE ?)');
            params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
        }

        if (subject) {
            const normalizedSubject = String(subject).toUpperCase().trim();
            where.push('course_code LIKE ?');
            params.push(normalizedSubject + '%');
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const countResult = await db.query('SELECT COUNT(*) AS count FROM courses ' + whereClause, params);
        const rows = await db.query('SELECT course_id, course_code, title, description, credits FROM courses ' + whereClause + ' ORDER BY course_code ASC, course_id ASC LIMIT ? OFFSET ?', [...params, normalizedLimit, offset]);
        const courses = rows.map((row) => ({
            ...Course.fromPersistence(row).toObject(),
            subject: getSubjectNameFromCourseCode(row.course_code),
        }));

        return {
            data: courses,
            meta: {
                page: normalizedPage,
                limit: normalizedLimit,
                total: countResult[0].count,
                totalPages: Math.ceil(countResult[0].count / normalizedLimit),
            },
        };
    }
}

export default CourseService;
