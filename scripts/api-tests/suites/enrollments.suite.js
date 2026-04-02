import * as db from '../../../backend/src/db/connection.js';
import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';

export async function runEnrollmentsSuite(ctx, request) {
    const refs = await getEnrollmentRefs(ctx, request);

    const getWithoutToken = await request('/api/enrollments/1');
    assertStatus(getWithoutToken, 401, 'GET /api/enrollments/:enrollmentId should reject missing token');
    logPass('GET /api/enrollments/:enrollmentId rejects missing token');

    const createAccessCases = [
        {
            options: {
                method: 'POST',
                body: JSON.stringify({ studentId: refs.studentIds[0], sectionId: refs.baseSectionId }),
            },
            expectedStatus: 401,
            failureMessage: 'POST /api/enrollments should reject missing token',
            successMessage: 'POST /api/enrollments rejects missing token',
        },
        {
            options: {
                method: 'POST',
                headers: authHeaders('not-a-real-token'),
                body: JSON.stringify({ studentId: refs.studentIds[0], sectionId: refs.baseSectionId }),
            },
            expectedStatus: 401,
            failureMessage: 'POST /api/enrollments should reject invalid token',
            successMessage: 'POST /api/enrollments rejects invalid token',
        },
    ];

    for (const testCase of createAccessCases) {
        const res = await request('/api/enrollments', testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidCreateBody = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[0] }),
    });
    assertStatus(invalidCreateBody, 400, 'POST /api/enrollments should reject invalid payloads');
    logPass('POST /api/enrollments rejects invalid payloads');

    const missingStudentCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: 999999999, sectionId: refs.baseSectionId }),
    });
    assertStatus(missingStudentCreate, 404, 'POST /api/enrollments should reject unknown students');
    logPass('POST /api/enrollments rejects unknown students');

    const missingSectionCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[0], sectionId: 999999999 }),
    });
    assertStatus(missingSectionCreate, 404, 'POST /api/enrollments should reject unknown sections');
    logPass('POST /api/enrollments rejects unknown sections');

    const studentCrossEnroll = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[0], sectionId: refs.baseSectionId }),
    });
    assertStatus(studentCrossEnroll, 403, 'POST /api/enrollments should prevent students from enrolling other students');
    logPass('POST /api/enrollments prevents students from enrolling other students');

    const studentSelfEnroll = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ studentId: refs.selfStudentId, sectionId: refs.baseSectionId }),
    });
    assertStatus(studentSelfEnroll, 201, 'POST /api/enrollments should allow students to enroll themselves');
    const selfEnrollmentId = studentSelfEnroll.body?.enrollment?.enrollment_id;
    assertTruthy(selfEnrollmentId, 'Student self-enrollment should return an enrollment id', studentSelfEnroll.body);
    assertEqual(studentSelfEnroll.body?.enrollment?.status, 'enrolled', 'Student self-enrollment should use enrolled status when capacity is available', studentSelfEnroll.body);
    logPass('POST /api/enrollments allows students to enroll themselves');

    const duplicateSelfEnroll = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ studentId: refs.selfStudentId, sectionId: refs.baseSectionId }),
    });
    assertStatus(duplicateSelfEnroll, 400, 'POST /api/enrollments should reject duplicate enrollment records');
    logPass('POST /api/enrollments rejects duplicate enrollment records');

    const adminGetSelfEnrollment = await request('/api/enrollments/' + selfEnrollmentId, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(adminGetSelfEnrollment, 200, 'GET /api/enrollments/:enrollmentId should allow admins');
    assertEqual(adminGetSelfEnrollment.body?.enrollment?.student_id, refs.selfStudentId, 'GET /api/enrollments/:enrollmentId should return the requested enrollment', adminGetSelfEnrollment.body);
    logPass('GET /api/enrollments/:enrollmentId allows admins');

    const studentGetOwnEnrollment = await request('/api/enrollments/' + selfEnrollmentId, {
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(studentGetOwnEnrollment, 200, 'GET /api/enrollments/:enrollmentId should allow students to read their own enrollment');
    logPass('GET /api/enrollments/:enrollmentId allows students to read their own enrollment');

    const otherStudentEnrollment = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[0], refs.baseSectionId);
    const studentGetOtherEnrollment = await request('/api/enrollments/' + otherStudentEnrollment.enrollment_id, {
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(studentGetOtherEnrollment, 403, 'GET /api/enrollments/:enrollmentId should prevent students from reading other enrollments');
    logPass('GET /api/enrollments/:enrollmentId prevents students from reading other enrollments');

    const unmetPrerequisiteCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[1], sectionId: refs.targetSectionId }),
    });
    assertStatus(unmetPrerequisiteCreate, 409, 'POST /api/enrollments should reject students who have not completed prerequisites');
    logPass('POST /api/enrollments rejects students without prerequisites');

    await db.query('INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)', [refs.studentIds[1], refs.prereqSectionId, 'COMPLETED']);
    const metPrerequisiteCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[1], sectionId: refs.targetSectionId }),
    });
    assertStatus(metPrerequisiteCreate, 201, 'POST /api/enrollments should allow students who completed prerequisites');
    assertEqual(metPrerequisiteCreate.body?.enrollment?.status, 'enrolled', 'POST /api/enrollments should enroll students who meet prerequisites', metPrerequisiteCreate.body);
    logPass('POST /api/enrollments allows students who completed prerequisites');

    const capacityOne = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[2], refs.limitedSectionId);
    assertEqual(capacityOne.status, 'enrolled', 'First enrollment in a limited section should be enrolled', capacityOne);
    const waitlistOne = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[3], refs.limitedSectionId);
    assertEqual(waitlistOne.status, 'waitlisted', 'Second enrollment in a full section should be waitlisted', waitlistOne);
    const waitlistTwo = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[4], refs.limitedSectionId);
    assertEqual(waitlistTwo.status, 'waitlisted', 'Third enrollment in a full section should be waitlisted', waitlistTwo);
    const waitlistThree = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[5], refs.limitedSectionId);
    assertEqual(waitlistThree.status, 'waitlisted', 'Fourth enrollment in a full section should be waitlisted', waitlistThree);
    logPass('POST /api/enrollments applies waitlist behavior after section capacity is reached');

    const sectionFullCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[6], sectionId: refs.limitedSectionId }),
    });
    assertStatus(sectionFullCreate, 409, 'POST /api/enrollments should reject enrollment when waitlist is full');
    logPass('POST /api/enrollments rejects enrollment when waitlist is full');

    const invalidUpdateBody = await request('/api/enrollments/' + selfEnrollmentId, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.selfStudentId }),
    });
    assertStatus(invalidUpdateBody, 400, 'PATCH /api/enrollments/:enrollmentId should reject invalid payloads');
    logPass('PATCH /api/enrollments/:enrollmentId rejects invalid payloads');

    const studentUpdateOther = await request('/api/enrollments/' + otherStudentEnrollment.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ status: 'dropped' }),
    });
    assertStatus(studentUpdateOther, 403, 'PATCH /api/enrollments/:enrollmentId should prevent students from updating other enrollments');
    logPass('PATCH /api/enrollments/:enrollmentId prevents students from updating other enrollments');

    const studentInvalidStatusChange = await request('/api/enrollments/' + selfEnrollmentId, {
        method: 'PATCH',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ status: 'completed' }),
    });
    assertStatus(studentInvalidStatusChange, 403, 'PATCH /api/enrollments/:enrollmentId should prevent students from marking themselves completed');
    logPass('PATCH /api/enrollments/:enrollmentId prevents privileged student status changes');

    const studentDropOwn = await request('/api/enrollments/' + selfEnrollmentId, {
        method: 'PATCH',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({ status: 'dropped' }),
    });
    assertStatus(studentDropOwn, 200, 'PATCH /api/enrollments/:enrollmentId should allow students to drop their own enrollments');
    assertEqual(studentDropOwn.body?.enrollment?.status, 'dropped', 'PATCH /api/enrollments/:enrollmentId should persist dropped status', studentDropOwn.body);
    logPass('PATCH /api/enrollments/:enrollmentId allows students to drop their own enrollments');

    const adminCompleteEnrollment = await request('/api/enrollments/' + metPrerequisiteCreate.body.enrollment.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ status: 'completed' }),
    });
    assertStatus(adminCompleteEnrollment, 200, 'PATCH /api/enrollments/:enrollmentId should allow admins to change enrollment status');
    assertEqual(adminCompleteEnrollment.body?.enrollment?.status, 'completed', 'PATCH /api/enrollments/:enrollmentId should persist admin status changes', adminCompleteEnrollment.body);
    logPass('PATCH /api/enrollments/:enrollmentId allows admins to change enrollment status');

    const studentDeleteOther = await request('/api/enrollments/' + otherStudentEnrollment.enrollment_id, {
        method: 'DELETE',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(studentDeleteOther, 403, 'DELETE /api/enrollments/:enrollmentId should prevent students from deleting other enrollments');
    logPass('DELETE /api/enrollments/:enrollmentId prevents students from deleting other enrollments');

    const studentDeleteOwn = await request('/api/enrollments/' + selfEnrollmentId, {
        method: 'DELETE',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(studentDeleteOwn, 200, 'DELETE /api/enrollments/:enrollmentId should allow students to delete their own enrollments');
    logPass('DELETE /api/enrollments/:enrollmentId allows students to delete their own enrollments');

    const getAfterDelete = await request('/api/enrollments/' + selfEnrollmentId, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getAfterDelete, 404, 'GET /api/enrollments/:enrollmentId should return 404 after deletion');
    logPass('GET /api/enrollments/:enrollmentId returns 404 after deletion');

    await cleanupEnrollmentFixtures(request, ctx.adminAuth.token, refs);
}

async function getEnrollmentRefs(ctx, request) {
    const students = await db.query('SELECT student_id FROM students ORDER BY student_id ASC LIMIT 7');
    assertTruthy(students.length >= 7, 'Enrollment tests require at least seven student rows', students);

    const sectionRefs = await getSectionRefs(request);
    const prereqCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRA', 'Enrollment Prereq');
    const targetCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRB', 'Enrollment Target');
    const baseCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRC', 'Enrollment Base');
    const limitedCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRD', 'Enrollment Limited');

    const prereqSectionId = await createSectionForEnrollmentTests(request, ctx.adminAuth.token, prereqCourseId, sectionRefs, 10);
    const targetSectionId = await createSectionForEnrollmentTests(request, ctx.adminAuth.token, targetCourseId, sectionRefs, 10);
    const baseSectionId = await createSectionForEnrollmentTests(request, ctx.adminAuth.token, baseCourseId, sectionRefs, 10);
    const limitedSectionId = await createSectionForEnrollmentTests(request, ctx.adminAuth.token, limitedCourseId, sectionRefs, 1);

    const addPrerequisite = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({
            courseId: targetCourseId,
            prerequisiteId: prereqCourseId,
        }),
    });
    assertStatus(addPrerequisite, 201, 'Enrollment test setup should create prerequisite relationships');

    return {
        studentIds: students.map((row) => row.student_id),
        selfStudentId: ctx.updatedNonAdminAuth.user.role_id,
        prereqCourseId,
        targetCourseId,
        baseCourseId,
        limitedCourseId,
        prereqSectionId,
        targetSectionId,
        baseSectionId,
        limitedSectionId,
    };
}

async function getSectionRefs(request) {
    const res = await request('/api/sections?page=1&limit=100');
    assertStatus(res, 200, 'Enrollment tests require section listing to discover semester and professor refs');

    const sections = Array.isArray(res.body?.sections) ? res.body.sections : [];
    const sectionWithProfessor = sections.find((section) => section.professor_id);
    const semesterIds = [...new Set(sections.map((section) => section.semester_id).filter(Boolean))];

    assertTruthy(semesterIds[0], 'Enrollment tests require at least one existing semester id from section data', res.body);
    assertTruthy(sectionWithProfessor?.professor_id, 'Enrollment tests require at least one existing professor id from section data', res.body);

    return {
        semesterId: semesterIds[0],
        professorId: sectionWithProfessor.professor_id,
    };
}

async function createCourseForEnrollmentTests(ctx, request, prefix, label) {
    const now = Date.now();
    const payload = {
        courseCode: prefix + String(now % 1000).padStart(3, '0'),
        courseTitle: label + ' ' + now,
        courseDescription: 'Created by apiTestRunner for enrollment validation.',
        courseCredits: 3,
    };

    const res = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(payload),
    });
    assertStatus(res, 201, 'Enrollment tests should create course fixtures');
    return res.body.course.course_id;
}

async function createSectionForEnrollmentTests(request, adminToken, courseId, refs, capacity) {
    const res = await request('/api/courses/' + courseId + '/sections', {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
            semesterId: refs.semesterId,
            professorId: refs.professorId,
            capacity,
            days: 'MW',
            startTime: '10:00',
            endTime: '11:15',
        }),
    });

    assertStatus(res, 201, 'Enrollment tests should create section fixtures');
    return res.body.section.section_id;
}

async function createEnrollment(request, adminToken, studentId, sectionId) {
    const res = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ studentId, sectionId }),
    });
    assertStatus(res, 201, 'Enrollment test setup should create enrollment fixtures');
    return res.body.enrollment;
}

async function cleanupEnrollmentFixtures(request, adminToken, refs) {
    await db.query('DELETE FROM enrollments WHERE section_id IN (?, ?, ?, ?)', [
        refs.prereqSectionId,
        refs.targetSectionId,
        refs.baseSectionId,
        refs.limitedSectionId,
    ]);

    await request('/api/prerequisites/' + refs.targetCourseId + '/' + refs.prereqCourseId, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
    });

    const sectionIds = [refs.prereqSectionId, refs.targetSectionId, refs.baseSectionId, refs.limitedSectionId];
    for (const sectionId of sectionIds) {
        await request('/api/sections/' + sectionId, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        });
    }

    const courseIds = [refs.prereqCourseId, refs.targetCourseId, refs.baseCourseId, refs.limitedCourseId];
    for (const courseId of courseIds) {
        await request('/api/courses/' + courseId, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        });
    }
}
