import * as db from '../db/connection.js';
import * as Errors from '../errors/index.js';
import PrerequisiteService from './prerequisite.service.js';
import SectionService from './section.service.js';
import Enrollment from '../domain/enrollment.js';

class EnrollmentService {
    constructor() {
        this.sectionService = new SectionService();
        this.prerequisiteService = new PrerequisiteService();
    }

    async addEnrollment(studentId, sectionId, actingUser, accessCode = null) {
        this.verifyAccess(studentId, actingUser);

        const existingStudent = await db.query('SELECT * FROM students WHERE student_id = ?', [studentId]);
        if (existingStudent.length === 0) {
            throw new Errors.NotFoundError('Student');
        }

        const section = await this.sectionService.getSectionInfo(sectionId);

        const prerequisites = await this.prerequisiteService.getPrerequisites(section.course_id);
        if (prerequisites.data.length > 0) {
            const completedCourses = await db.query('SELECT s.course_id FROM enrollments e INNER JOIN sections s ON e.section_id = s.section_id WHERE e.student_id = ? AND e.status = ?', [studentId, 'completed']);
            const completedCourseIds = new Set(completedCourses.map((row) => row.course_id));
            const missingPrerequisites = prerequisites.data.filter((prereq) => !completedCourseIds.has(prereq.courseId));

            if (missingPrerequisites.length > 0) {
                throw new Errors.PrerequisiteNotMetError(
                    section.course_id,
                    missingPrerequisites.map((prereq) => prereq.courseCode)
                );
            }
        }

        const existingEnrollment = await db.query('SELECT * FROM enrollments WHERE student_id = ? AND section_id = ? LIMIT 1', [studentId, sectionId]);
        if (existingEnrollment.length > 0) {
            throw new Errors.ValidationError('Student already has an enrollment record for this section.');
        }

        if (accessCode) {
            const insertResult = await this.enrollWithAccessCode(sectionId, studentId, null, accessCode);
            const enrollments = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [insertResult]);
            const enrollment = Enrollment.fromPersistence(enrollments[0]);
            return enrollment.toObject();
        }

        const insertResult = await this.enrollmentHelper(sectionId, studentId);

        const enrollments = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [insertResult]);
        const enrollment = Enrollment.fromPersistence(enrollments[0]);
        return enrollment.toObject();
    }

    async updateEnrollment(enrollmentId, status, actingUser, accessCode = null) {
        const existingEnrollment = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [enrollmentId]);
        if (existingEnrollment.length === 0) {
            throw new Errors.NotFoundError('Enrollment');
        }

        const currentEnrollment = existingEnrollment[0];
        this.verifyAccess(currentEnrollment.student_id, actingUser);
        if (actingUser?.role === 'STUDENT' && !(status === 'dropped' || (status === 'enrolled' && accessCode))) {
            throw new Errors.AuthorizationError('Students may only drop their own enrollments or use a valid access code to enroll.');
        }

        if (status === currentEnrollment.status) {
            const enrollment = Enrollment.fromPersistence(currentEnrollment);
            return enrollment.toObject();
        }

        if (status === 'dropped') {
            if (!['enrolled', 'waitlisted'].includes(currentEnrollment.status)) {
                throw new Errors.ValidationError('Only enrolled or waitlisted records can be dropped.');
            }

            await db.query('UPDATE enrollments SET status = ? WHERE enrollment_id = ?', [status, enrollmentId]);

            if (currentEnrollment.status === 'enrolled') {
                await this.enrollmentHelper(currentEnrollment.section_id);
            }
        } else if (status === 'completed') {
            if (currentEnrollment.status !== 'enrolled') {
                throw new Errors.ValidationError('Only enrolled records can be marked completed.');
            }

            await db.query('UPDATE enrollments SET status = ? WHERE enrollment_id = ?', [status, enrollmentId]);
        } else if (status === 'enrolled') {
            if (currentEnrollment.status !== 'waitlisted') {
                throw new Errors.ValidationError('Only waitlisted records can be moved to enrolled.');
            }

            if (accessCode) {
                await this.enrollWithAccessCode(currentEnrollment.section_id, null, enrollmentId, accessCode);
            } else {
                const connection = await db.getConnection();
                try {
                    await db.beginTransaction(connection);

                    const sectionRows = await db.queryWithConnection(connection, 'SELECT capacity FROM sections WHERE section_id = ? FOR UPDATE', [currentEnrollment.section_id]);
                    const enrollmentRows = await db.queryWithConnection(connection, 'SELECT enrollment_id, status FROM enrollments WHERE section_id = ? ORDER BY enrollment_id ASC FOR UPDATE', [currentEnrollment.section_id]);
                    const enrolledCount = enrollmentRows.filter((row) => row.status === 'enrolled').length;
                    const firstWaitlisted = enrollmentRows.find((row) => row.status === 'waitlisted');

                    if (enrolledCount >= Number(sectionRows[0].capacity)) {
                        throw new Errors.SectionFullError(currentEnrollment.section_id);
                    }

                    if (!firstWaitlisted || Number(firstWaitlisted.enrollment_id) !== Number(enrollmentId)) {
                        throw new Errors.ValidationError('Only the next waitlisted student may be promoted.');
                    }

                    await db.queryWithConnection(connection, 'UPDATE enrollments SET status = ? WHERE enrollment_id = ?', [status, enrollmentId]);
                    await db.commit(connection);
                } catch (err) {
                    await db.rollback(connection);
                    throw err;
                } finally {
                    db.releaseConnection(connection);
                }
            }
        } else {
            throw new Errors.ValidationError('Manual transition to waitlisted is not allowed.');
        }

        const rows = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [enrollmentId]);
        const enrollment = Enrollment.fromPersistence(rows[0]);
        return enrollment.toObject();
    }

    async getEnrollmentInfo(enrollmentId, actingUser) {
        const enrollments = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [enrollmentId]);

        if (!enrollments.length) {
            throw new Errors.NotFoundError('Enrollment');
        }

        const enrollment = Enrollment.fromPersistence(enrollments[0]);

        this.verifyAccess(enrollment.getStudentID(), actingUser);

        return enrollment.toObject();
    }

    async removeEnrollment(enrollmentId, actingUser) {
        const enrollments = await db.query('SELECT * FROM enrollments WHERE enrollment_id = ?', [enrollmentId]);
        if (enrollments.length === 0) {
            throw new Errors.NotFoundError('Enrollment');
        }

        const enrollment = Enrollment.fromPersistence(enrollments[0]);

        this.verifyAccess(enrollment.getStudentID(), actingUser);
        await db.query('DELETE FROM enrollments WHERE enrollment_id = ?', [enrollmentId]);

        await this.enrollmentHelper(enrollment.getSectionID());

        return {
            message: 'Enrollment removed successfully.',
        };
    }

    verifyAccess(studentId, actingUser) {
        if (actingUser?.role === 'STUDENT' && Number(actingUser.role_id) !== Number(studentId)) {
            throw new Errors.AuthorizationError('Students may only manage their own enrollments.');
        }
    }

    async enrollWithAccessCode(sectionId, studentId = null, enrollmentId = null, accessCode) {
        const connection = await db.getConnection();
        try {
            await db.beginTransaction(connection);

            const sectionRows = await db.queryWithConnection(connection, 'SELECT access_codes FROM sections WHERE section_id = ? FOR UPDATE', [sectionId]);
            if (sectionRows.length === 0) {
                throw new Errors.NotFoundError('Section');
            }

            const accessCodes = { ...(sectionRows[0].access_codes ?? {}) };
            const matchingKey = Object.keys(accessCodes).find((key) => /^code\d+$/.test(key) && accessCodes[key] === accessCode);
            if (!matchingKey || accessCodes[matchingKey + '_used'] !== false) {
                throw new Errors.ValidationError('Invalid or already used access code.');
            }

            accessCodes[matchingKey + '_used'] = true;
            await db.queryWithConnection(connection, 'UPDATE sections SET access_codes = ? WHERE section_id = ?', [JSON.stringify(accessCodes), sectionId]);

            if (enrollmentId) {
                await db.queryWithConnection(connection, 'UPDATE enrollments SET status = ? WHERE enrollment_id = ?', ['enrolled', enrollmentId]);
                await db.commit(connection);
                return enrollmentId;
            }

            try {
                const result = await db.queryWithConnection(connection, 'INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)', [studentId, sectionId, 'enrolled']);
                await db.commit(connection);
                return result.insertId;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    throw new Errors.ValidationError('Student already has an enrollment record for this section.');
                }
                throw err;
            }
        } catch (err) {
            await db.rollback(connection);
            throw err;
        } finally {
            db.releaseConnection(connection);
        }
    }

    async enrollmentHelper(sectionId, studentId = null) {
        const connection = await db.getConnection();
        try {
            await db.beginTransaction(connection);

            const capacityRows = await db.queryWithConnection(connection, 'SELECT capacity FROM sections WHERE section_id = ? FOR UPDATE', [sectionId]);
            if (capacityRows.length === 0) {
                throw new Errors.NotFoundError('Section');
            }

            const capacity = Number(capacityRows[0].capacity);
            const enrollmentRows = await db.queryWithConnection(connection, 'SELECT enrollment_id, status FROM enrollments WHERE section_id = ? ORDER BY enrollment_id ASC FOR UPDATE', [sectionId]);

            let enrolledCount = enrollmentRows.filter((row) => row.status === 'enrolled').length;
            const waitlistedRows = enrollmentRows.filter((row) => row.status === 'waitlisted');
            let waitlistCount = waitlistedRows.length;

            if (waitlistedRows.length > 0 && enrolledCount < capacity) {
                for (const row of waitlistedRows) {
                    if (enrolledCount >= capacity) {
                        break;
                    }

                    await db.queryWithConnection(connection, 'UPDATE enrollments SET status = ? WHERE enrollment_id = ?', ['enrolled', row.enrollment_id]);
                    enrolledCount += 1;
                    waitlistCount -= 1;
                }
            }

            if (!studentId) {
                await db.commit(connection);
                return;
            }

            if (enrolledCount < capacity) {
                try {
                    const result = await db.queryWithConnection(connection, 'INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)', [studentId, sectionId, 'enrolled']);
                    await db.commit(connection);
                    return result.insertId;
                } catch (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        throw new Errors.ValidationError('Student already has an enrollment record for this section.');
                    }
                    throw err;
                }
            }

            if (waitlistCount < 3) {
                try {
                    const result = await db.queryWithConnection(connection, 'INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)', [studentId, sectionId, 'waitlisted']);
                    await db.commit(connection);
                    return result.insertId;
                } catch (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        throw new Errors.ValidationError('Student already has an enrollment record for this section.');
                    }
                    throw err;
                }
            }

            throw new Errors.SectionFullError(sectionId);
        } catch (err) {
            await db.rollback(connection);
            throw err;
        } finally {
            db.releaseConnection(connection);
        }
    }
}

export default EnrollmentService;
