import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';

class SemesterService {
    constructor() {}

    async getAllSemesters() {
        return db.query('SELECT semester_id, term, year FROM semesters ORDER BY year DESC, semester_id DESC', []);
    }

    async getSemesterInfo(semesterId) {
        const rows = await db.query('SELECT semester_id, term, year FROM semesters WHERE semester_id = ?', [semesterId]);

        if (rows.length === 0) {
            throw new Errors.NotFoundError('Semester');
        }

        return rows[0];
    }

    async addSemester(term, year) {
        const existing = await db.query('SELECT COUNT(*) AS count FROM semesters WHERE term = ? AND year = ?', [term, year]);
        if (Number(existing[0].count) > 0) {
            throw new Errors.DuplicateEntryError('Semester already exists.');
        }

        const result = await db.query('INSERT INTO semesters (term, year) VALUES (?, ?)', [term, year]);
        return this.getSemesterInfo(result.insertId);
    }

    async removeSemester(semesterId) {
        const existing = await db.query('SELECT COUNT(*) AS count FROM semesters WHERE semester_id = ?', [semesterId]);
        if (Number(existing[0].count) === 0) {
            throw new Errors.NotFoundError('Semester');
        }

        const dependentSections = await db.query('SELECT COUNT(*) AS count FROM sections WHERE semester_id = ?', [semesterId]);
        if (Number(dependentSections[0].count) > 0) {
            throw new Errors.ValidationError('Cannot delete a semester that has scheduled sections.');
        }

        await db.query('DELETE FROM semesters WHERE semester_id = ?', [semesterId]);
    }
}

export default SemesterService;
