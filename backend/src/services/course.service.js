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

        await db.query('DELETE FROM courses WHERE course_id = ?', [courseId]);
    }
}

export default CourseService;
