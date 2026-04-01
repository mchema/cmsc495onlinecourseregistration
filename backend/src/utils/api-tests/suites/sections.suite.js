import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';
import * as db from '../../../db/connection.js';

export async function runSectionsSuite(ctx, request) {
    const refs = await getSectionRefs();
    const createdCourseId = await createCourseForSectionTests(ctx, request);

    const invalidListQuery = await request('/api/sections?page=-1&limit=0');
    assertStatus(invalidListQuery, 400, 'GET /api/sections should reject invalid pagination values');
    logPass('GET /api/sections rejects invalid pagination values');

    const invalidSemesterQuery = await request('/api/sections?semesterId=invalid');
    assertStatus(invalidSemesterQuery, 400, 'GET /api/sections should reject invalid semester filters');
    logPass('GET /api/sections rejects invalid semester filters');

    const publicList = await request('/api/sections?page=1&limit=5');
    assertStatus(publicList, 200, 'GET /api/sections should return a public section list');
    assertTruthy(Array.isArray(publicList.body?.sections), 'GET /api/sections should return a sections array', publicList.body);
    assertEqual(publicList.body?.meta?.page, 1, 'GET /api/sections should return requested page', publicList.body);
    assertEqual(publicList.body?.meta?.limit, 5, 'GET /api/sections should return requested limit', publicList.body);
    logPass('GET /api/sections returns paginated public results');

    const nestedEmptyList = await request(`/api/courses/${createdCourseId}/sections?search=definitely-no-match`);
    assertStatus(nestedEmptyList, 200, 'GET /api/courses/:courseId/sections should return 200 for empty result sets');
    assertEqual(nestedEmptyList.body?.meta?.total, 0, 'GET /api/courses/:courseId/sections should report zero total for empty result sets', nestedEmptyList.body);
    logPass('GET /api/courses/:courseId/sections returns empty paginated payloads cleanly');

    const createPayload = {
        semesterId: refs.semesterId,
        professorId: refs.professorId,
        capacity: ctx.sectionTest.create.capacity,
        days: ctx.sectionTest.create.days,
        startTime: ctx.sectionTest.create.startTime,
        endTime: ctx.sectionTest.create.endTime,
    };

    const createAccessCases = [
        {
            options: { method: 'POST', body: JSON.stringify(createPayload) },
            expectedStatus: 401,
            failureMessage: 'POST /api/courses/:courseId/sections should reject missing token',
            successMessage: 'POST /api/courses/:courseId/sections rejects missing token',
        },
        {
            options: { method: 'POST', headers: authHeaders('not-a-real-token'), body: JSON.stringify(createPayload) },
            expectedStatus: 401,
            failureMessage: 'POST /api/courses/:courseId/sections should reject invalid token',
            successMessage: 'POST /api/courses/:courseId/sections rejects invalid token',
        },
        {
            options: { method: 'POST', headers: authHeaders(ctx.updatedNonAdminAuth.token), body: JSON.stringify(createPayload) },
            expectedStatus: 403,
            failureMessage: 'POST /api/courses/:courseId/sections should reject non-admin user',
            successMessage: 'POST /api/courses/:courseId/sections rejects non-admin user',
        },
    ];

    for (const testCase of createAccessCases) {
        const res = await request(`/api/courses/${createdCourseId}/sections`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidCreateBody = await request(`/api/courses/${createdCourseId}/sections`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...createPayload, startTime: '9am' }),
    });
    assertStatus(invalidCreateBody, 400, 'POST /api/courses/:courseId/sections should reject invalid time formats');
    logPass('POST /api/courses/:courseId/sections rejects invalid payloads');

    const invalidCreateDays = await request(`/api/courses/${createdCourseId}/sections`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...createPayload, days: 'banana' }),
    });
    assertStatus(invalidCreateDays, 400, 'POST /api/courses/:courseId/sections should reject invalid day codes');
    logPass('POST /api/courses/:courseId/sections rejects invalid meeting day values');

    const invalidCreateMissingEndTime = await request(`/api/courses/${createdCourseId}/sections`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...createPayload, endTime: undefined }),
    });
    assertStatus(invalidCreateMissingEndTime, 400, 'POST /api/courses/:courseId/sections should reject unpaired meeting times');
    logPass('POST /api/courses/:courseId/sections rejects unpaired meeting times');

    const invalidCreateTimeRange = await request(`/api/courses/${createdCourseId}/sections`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...createPayload, startTime: '14:00', endTime: '09:00' }),
    });
    assertStatus(invalidCreateTimeRange, 400, 'POST /api/courses/:courseId/sections should reject reversed time ranges');
    logPass('POST /api/courses/:courseId/sections rejects reversed time ranges');

    const createMissingCourse = await request('/api/courses/999999999/sections', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(createPayload),
    });
    assertStatus(createMissingCourse, 404, 'POST /api/courses/:courseId/sections should reject unknown courses');
    logPass('POST /api/courses/:courseId/sections rejects unknown courses');

    const createSection = await request(`/api/courses/${createdCourseId}/sections`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(createPayload),
    });
    assertStatus(createSection, 201, 'POST /api/courses/:courseId/sections should allow admin user');
    const createdSectionId = createSection.body?.section?.section_id;
    assertTruthy(createdSectionId, 'POST /api/courses/:courseId/sections should return created section id', createSection.body);
    assertEqual(createSection.body?.section?.course_id, createdCourseId, 'Created section should reference requested course', createSection.body);
    assertEqual(createSection.body?.section?.semester_id, refs.semesterId, 'Created section should reference requested semester', createSection.body);
    assertEqual(createSection.body?.section?.start_time, '09:00:00', 'Created section should persist normalized SQL start times', createSection.body);
    assertEqual(createSection.body?.section?.end_time, '10:15:00', 'Created section should persist normalized SQL end times', createSection.body);
    logPass('POST /api/courses/:courseId/sections allows admin user to create sections');

    const getById = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getById, 200, 'GET /api/sections/:sectionId should return created section');
    assertEqual(getById.body?.section?.section_id, createdSectionId, 'GET /api/sections/:sectionId returned wrong section', getById.body);
    assertEqual(getById.body?.section?.days, createPayload.days, 'GET /api/sections/:sectionId should return created section data', getById.body);
    assertEqual(getById.body?.section?.start_time, '09:00:00', 'GET /api/sections/:sectionId should return normalized SQL start times', getById.body);
    logPass('GET /api/sections/:sectionId returns created section');

    const filteredByCourse = await request(`/api/courses/${createdCourseId}/sections?search=${refs.professorId}&limit=10`);
    assertStatus(filteredByCourse, 200, 'GET /api/courses/:courseId/sections should support course-scoped queries');
    assertTruthy(
        filteredByCourse.body?.sections?.some((section) => section.section_id === createdSectionId),
        'GET /api/courses/:courseId/sections should include the created section',
        filteredByCourse.body
    );
    assertTruthy(
        filteredByCourse.body?.sections?.every((section) => section.course_id === createdCourseId),
        'GET /api/courses/:courseId/sections should only return sections for the requested course',
        filteredByCourse.body
    );
    logPass('GET /api/courses/:courseId/sections enforces course scoping');

    const filteredBySemester = await request(`/api/sections?semesterId=${refs.semesterId}&limit=20`);
    assertStatus(filteredBySemester, 200, 'GET /api/sections should support semester filtering');
    assertTruthy(
        filteredBySemester.body?.sections?.some((section) => section.section_id === createdSectionId),
        'GET /api/sections semester filter should return the created section',
        filteredBySemester.body
    );
    assertTruthy(
        filteredBySemester.body?.sections?.every((section) => section.semester_id === refs.semesterId),
        'GET /api/sections semester filter should only return matching sections',
        filteredBySemester.body
    );
    logPass('GET /api/sections supports semester filtering');

    const filteredByProfessor = await request(`/api/sections?professorId=${refs.professorId}&limit=20`);
    assertStatus(filteredByProfessor, 200, 'GET /api/sections should support professor filtering');
    assertTruthy(
        filteredByProfessor.body?.sections?.some((section) => section.section_id === createdSectionId),
        'GET /api/sections professor filter should return the created section',
        filteredByProfessor.body
    );
    logPass('GET /api/sections supports professor filtering');

    const updatePayload = {
        semesterId: refs.altSemesterId,
        professorId: refs.professorId,
        capacity: ctx.sectionTest.update.capacity,
        days: ctx.sectionTest.update.days,
        startTime: ctx.sectionTest.update.startTime,
        endTime: ctx.sectionTest.update.endTime,
    };

    const updateAccessCases = [
        {
            options: { method: 'PATCH', body: JSON.stringify(updatePayload) },
            expectedStatus: 401,
            failureMessage: 'PATCH /api/sections/:sectionId should reject missing token',
            successMessage: 'PATCH /api/sections/:sectionId rejects missing token',
        },
        {
            options: { method: 'PATCH', headers: authHeaders('not-a-real-token'), body: JSON.stringify(updatePayload) },
            expectedStatus: 401,
            failureMessage: 'PATCH /api/sections/:sectionId should reject invalid token',
            successMessage: 'PATCH /api/sections/:sectionId rejects invalid token',
        },
        {
            options: { method: 'PATCH', headers: authHeaders(ctx.updatedNonAdminAuth.token), body: JSON.stringify(updatePayload) },
            expectedStatus: 403,
            failureMessage: 'PATCH /api/sections/:sectionId should reject non-admin user',
            successMessage: 'PATCH /api/sections/:sectionId rejects non-admin user',
        },
    ];

    for (const testCase of updateAccessCases) {
        const res = await request(`/api/sections/${createdSectionId}`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidUpdateBody = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...updatePayload, capacity: 0 }),
    });
    assertStatus(invalidUpdateBody, 400, 'PATCH /api/sections/:sectionId should reject invalid payloads');
    logPass('PATCH /api/sections/:sectionId rejects invalid payloads');

    const invalidUpdateDays = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...updatePayload, days: 'WM' }),
    });
    assertStatus(invalidUpdateDays, 400, 'PATCH /api/sections/:sectionId should reject non-canonical day ordering');
    logPass('PATCH /api/sections/:sectionId rejects invalid meeting day ordering');

    const invalidUpdateMissingStartTime = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...updatePayload, startTime: undefined }),
    });
    assertStatus(invalidUpdateMissingStartTime, 400, 'PATCH /api/sections/:sectionId should reject unpaired meeting times');
    logPass('PATCH /api/sections/:sectionId rejects unpaired meeting times');

    const invalidUpdateTimeRange = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...updatePayload, startTime: '15:00', endTime: '14:45' }),
    });
    assertStatus(invalidUpdateTimeRange, 400, 'PATCH /api/sections/:sectionId should reject reversed time ranges');
    logPass('PATCH /api/sections/:sectionId rejects reversed time ranges');

    const updateSection = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(updatePayload),
    });
    assertStatus(updateSection, 200, 'PATCH /api/sections/:sectionId should allow admin user');
    assertEqual(updateSection.body?.section?.semester_id, refs.altSemesterId, 'PATCH /api/sections/:sectionId should update semester', updateSection.body);
    assertEqual(updateSection.body?.section?.capacity, updatePayload.capacity, 'PATCH /api/sections/:sectionId should update capacity', updateSection.body);
    assertEqual(updateSection.body?.section?.days, updatePayload.days, 'PATCH /api/sections/:sectionId should update meeting days', updateSection.body);
    assertEqual(updateSection.body?.section?.start_time, '13:30:00', 'PATCH /api/sections/:sectionId should persist normalized SQL start times', updateSection.body);
    assertEqual(updateSection.body?.section?.end_time, '14:45:00', 'PATCH /api/sections/:sectionId should persist normalized SQL end times', updateSection.body);
    logPass('PATCH /api/sections/:sectionId allows admin user to update sections');

    const getAfterUpdate = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getAfterUpdate, 200, 'GET /api/sections/:sectionId should return updated section');
    assertEqual(getAfterUpdate.body?.section?.semester_id, refs.altSemesterId, 'GET /api/sections/:sectionId should reflect updated semester', getAfterUpdate.body);
    assertEqual(getAfterUpdate.body?.section?.days, updatePayload.days, 'GET /api/sections/:sectionId should reflect updated meeting days', getAfterUpdate.body);
    logPass('GET /api/sections/:sectionId reflects updated section data');

    const deleteAccessCases = [
        {
            options: { method: 'DELETE' },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/sections/:sectionId should reject missing token',
            successMessage: 'DELETE /api/sections/:sectionId rejects missing token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders('not-a-real-token') },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/sections/:sectionId should reject invalid token',
            successMessage: 'DELETE /api/sections/:sectionId rejects invalid token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders(ctx.updatedNonAdminAuth.token) },
            expectedStatus: 403,
            failureMessage: 'DELETE /api/sections/:sectionId should reject non-admin user',
            successMessage: 'DELETE /api/sections/:sectionId rejects non-admin user',
        },
    ];

    for (const testCase of deleteAccessCases) {
        const res = await request(`/api/sections/${createdSectionId}`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const guardedSectionId = await createGuardedSection(createdCourseId, refs);

    const deleteGuardedSection = await request(`/api/sections/${guardedSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteGuardedSection, 400, 'DELETE /api/sections/:sectionId should reject deletion when enrollments exist');
    logPass('DELETE /api/sections/:sectionId rejects deletion when enrollments exist');

    await db.query('DELETE FROM enrollments WHERE section_id = ?', [guardedSectionId]);

    const deleteGuardedSectionAfterCleanup = await request(`/api/sections/${guardedSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteGuardedSectionAfterCleanup, 200, 'DELETE /api/sections/:sectionId should succeed after enrollments are removed');
    logPass('DELETE /api/sections/:sectionId succeeds after dependent enrollments are removed');

    const deleteSection = await request(`/api/sections/${createdSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteSection, 200, 'DELETE /api/sections/:sectionId should allow admin user');
    logPass('DELETE /api/sections/:sectionId allows admin user to delete sections');

    const getAfterDelete = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getAfterDelete, 404, 'GET /api/sections/:sectionId should return 404 after deletion');
    logPass('GET /api/sections/:sectionId returns 404 after deletion');

    await db.query('DELETE FROM courses WHERE course_id = ?', [createdCourseId]);
}

async function getSectionRefs() {
    const semesters = await db.query('SELECT semester_id FROM semesters ORDER BY semester_id ASC LIMIT 2');
    const professors = await db.query('SELECT professor_id FROM professors ORDER BY professor_id ASC LIMIT 1');
    const students = await db.query('SELECT student_id FROM students ORDER BY student_id ASC LIMIT 1');

    assertTruthy(semesters[0]?.semester_id, 'Section tests require at least one semester seed row', semesters);
    assertTruthy(semesters[1]?.semester_id, 'Section tests require at least two semester seed rows', semesters);
    assertTruthy(professors[0]?.professor_id, 'Section tests require at least one professor seed row', professors);
    assertTruthy(students[0]?.student_id, 'Section tests require at least one student seed row', students);

    return {
        semesterId: semesters[0].semester_id,
        altSemesterId: semesters[1].semester_id,
        professorId: professors[0].professor_id,
        studentId: students[0].student_id,
    };
}

async function createCourseForSectionTests(ctx, request) {
    const now = Date.now();
    const payload = {
        courseCode: `APIS${String(now).slice(-3)}`,
        courseTitle: `API Section Test Course ${now}`,
        courseDescription: 'Created by apiTestRunner for section CRUD validation.',
        courseCredits: 3,
    };

    const res = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(payload),
    });

    assertStatus(res, 201, 'POST /api/courses should create a course for section tests');
    assertTruthy(res.body?.course?.course_id, 'Section tests require a created course id', res.body);

    return res.body.course.course_id;
}

async function createGuardedSection(courseId, refs) {
    const sectionResult = await db.query('INSERT INTO sections (course_id, semester_id, professor_id, capacity, days, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)', [courseId, refs.semesterId, refs.professorId, 20, 'MW', '09:00:00', '10:15:00']);
    const guardedSectionId = sectionResult.insertId;

    await db.query('INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)', [refs.studentId, guardedSectionId, 'enrolled']);

    return guardedSectionId;
}
