import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';

class PrerequisiteService {
    constructor() {}

    async getPrerequisites(courseId) {
        const courseExists = await db.query('SELECT COUNT(*) as count FROM courses WHERE course_id = ?', [courseId]);
        if (Number(courseExists[0].count) === 0) {
            throw new Errors.CourseNotFoundError(courseId);
        }

        const rows = await db.query('SELECT c.course_id, c.course_code, c.title FROM prerequisites p INNER JOIN courses c ON p.prerequisite_course_id = c.course_id WHERE p.course_id = ? ORDER BY c.course_code ASC', [courseId]);

        return {
            data: rows.map((row) => ({
                courseId: row.course_id,
                courseCode: row.course_code,
                title: row.title,
            })),
        };
    }

    async addPrerequisite(courseId, prerequisiteId) {
        const courseExists = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_id = ?', [courseId]);
        if (courseExists[0].count === 0) {
            throw new Errors.CourseNotFoundError(courseId);
        }

        const prerequisiteExists = await db.query('SELECT COUNT(*) AS count FROM courses WHERE course_id = ?', [prerequisiteId]);
        if (prerequisiteExists[0].count === 0) {
            throw new Errors.CourseNotFoundError(prerequisiteId);
        }

        const existingRelationship = await db.query('SELECT COUNT(*) AS count FROM prerequisites WHERE course_id = ? AND prerequisite_course_id = ?', [courseId, prerequisiteId]);
        if (existingRelationship[0].count > 0) {
            throw new Errors.DuplicatePrerequisiteError(courseId, prerequisiteId);
        }

        if (courseId === prerequisiteId) {
            throw new Errors.ValidationError('A course cannot be a prerequisite of itself.');
        }

        await this.ensureNoCycle(prerequisiteId, courseId);
        try {
            await db.query('INSERT INTO prerequisites (course_id, prerequisite_course_id) VALUES (?, ?)', [courseId, prerequisiteId]);
        } catch (err) {
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Errors.CourseNotFoundError('One of the courses specified does not exist.');
            }
            throw new Errors.DatabaseError('Failed to add prerequisite relationship.', err);
        }

        return {
            courseId: courseId,
            prerequisiteId: prerequisiteId,
        };
    }

    async removePrerequisite(courseId, prerequisiteId) {
        const prerequisiteExists = await db.query('SELECT COUNT(*) AS count FROM prerequisites WHERE course_id = ? AND prerequisite_course_id = ?', [courseId, prerequisiteId]);
        if (Number(prerequisiteExists[0].count) === 0) {
            throw new Errors.PrerequisiteRelationshipNotFoundError(courseId, prerequisiteId);
        }

        await db.query('DELETE FROM prerequisites WHERE course_id = ? AND prerequisite_course_id = ?', [courseId, prerequisiteId]);
    }

    async ensureNoCycle(newPrerequisiteId, targetCourseId) {
        const allEdges = await db.query('SELECT prerequisite_course_id, course_id FROM prerequisites', []);

        const adjacency = new Map();

        for (const edge of allEdges) {
            if (!adjacency.has(edge.course_id)) {
                adjacency.set(edge.course_id, []);
            }
            adjacency.get(edge.course_id).push(edge.prerequisite_course_id);
        }

        if (!adjacency.has(targetCourseId)) {
            adjacency.set(targetCourseId, []);
        }
        adjacency.get(targetCourseId).push(newPrerequisiteId);

        const visited = new Set();
        const visiting = new Set();

        const dfs = (courseId) => {
            if (visiting.has(courseId)) {
                return true;
            }

            if (visited.has(courseId)) {
                return false;
            }

            visiting.add(courseId);

            const prereqs = adjacency.get(courseId) || [];
            for (const prereqId of prereqs) {
                if (dfs(prereqId)) {
                    return true;
                }
            }

            visiting.delete(courseId);
            visited.add(courseId);
            return false;
        };

        if (dfs(targetCourseId)) {
            throw new Errors.PrerequisiteCycleError(targetCourseId, newPrerequisiteId);
        }
    }
}

export default PrerequisiteService;
