import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';

export async function runPrerequisitesSuite(ctx, request) {
    const refs = await createPrerequisiteCourseRefs(ctx, request);

    const invalidGet = await request('/api/prerequisites/invalid');
    assertStatus(invalidGet, 400, 'GET /api/prerequisites/:courseId should reject invalid course ids');
    logPass('GET /api/prerequisites/:courseId rejects invalid course ids');

    const missingGet = await request('/api/prerequisites/999999999');
    assertStatus(missingGet, 404, 'GET /api/prerequisites/:courseId should reject unknown courses');
    logPass('GET /api/prerequisites/:courseId rejects unknown courses');

    const publicEmptyList = await request('/api/prerequisites/' + refs.targetCourseId);
    assertStatus(publicEmptyList, 200, 'GET /api/prerequisites/:courseId should return 200 for courses without prerequisites');
    assertTruthy(Array.isArray(publicEmptyList.body?.data), 'GET /api/prerequisites/:courseId should return a data array', publicEmptyList.body);
    assertEqual(publicEmptyList.body?.data?.length, 0, 'GET /api/prerequisites/:courseId should start empty for a new course', publicEmptyList.body);
    logPass('GET /api/prerequisites/:courseId returns an empty list for courses without prerequisites');

    const createAccessCases = [
        {
            options: {
                method: 'POST',
                body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqOneId }),
            },
            expectedStatus: 401,
            failureMessage: 'POST /api/prerequisites should reject missing token',
            successMessage: 'POST /api/prerequisites rejects missing token',
        },
        {
            options: {
                method: 'POST',
                headers: authHeaders('not-a-real-token'),
                body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqOneId }),
            },
            expectedStatus: 401,
            failureMessage: 'POST /api/prerequisites should reject invalid token',
            successMessage: 'POST /api/prerequisites rejects invalid token',
        },
        {
            options: {
                method: 'POST',
                headers: authHeaders(ctx.updatedNonAdminAuth.token),
                body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqOneId }),
            },
            expectedStatus: 403,
            failureMessage: 'POST /api/prerequisites should reject non-admin user',
            successMessage: 'POST /api/prerequisites rejects non-admin user',
        },
    ];

    for (const testCase of createAccessCases) {
        const res = await request('/api/prerequisites', testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidCreateBody = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId }),
    });
    assertStatus(invalidCreateBody, 400, 'POST /api/prerequisites should reject missing prerequisite ids');
    logPass('POST /api/prerequisites rejects invalid payloads');

    const missingCourseCreate = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: 999999999, prerequisiteId: refs.prereqOneId }),
    });
    assertStatus(missingCourseCreate, 404, 'POST /api/prerequisites should reject unknown target courses');
    logPass('POST /api/prerequisites rejects unknown target courses');

    const missingPrereqCreate = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: 999999998 }),
    });
    assertStatus(missingPrereqCreate, 404, 'POST /api/prerequisites should reject unknown prerequisite courses');
    logPass('POST /api/prerequisites rejects unknown prerequisite courses');

    const selfPrerequisiteCreate = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.targetCourseId }),
    });
    assertStatus(selfPrerequisiteCreate, 400, 'POST /api/prerequisites should reject self-referential prerequisites');
    logPass('POST /api/prerequisites rejects self-referential prerequisites');

    const createFirstPrerequisite = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqOneId }),
    });
    assertStatus(createFirstPrerequisite, 201, 'POST /api/prerequisites should allow admins to add prerequisites');
    assertEqual(createFirstPrerequisite.body?.prerequisite?.courseId, refs.targetCourseId, 'POST /api/prerequisites should return target course id', createFirstPrerequisite.body);
    assertEqual(createFirstPrerequisite.body?.prerequisite?.prerequisiteId, refs.prereqOneId, 'POST /api/prerequisites should return prerequisite id', createFirstPrerequisite.body);
    logPass('POST /api/prerequisites allows admins to add prerequisites');

    const duplicateCreate = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqOneId }),
    });
    assertStatus(duplicateCreate, 409, 'POST /api/prerequisites should reject duplicate relationships');
    logPass('POST /api/prerequisites rejects duplicate relationships');

    const createSecondPrerequisite = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.targetCourseId, prerequisiteId: refs.prereqTwoId }),
    });
    assertStatus(createSecondPrerequisite, 201, 'POST /api/prerequisites should allow multiple prerequisites per course');
    logPass('POST /api/prerequisites allows multiple prerequisites per course');

    const getAfterCreate = await request('/api/prerequisites/' + refs.targetCourseId);
    assertStatus(getAfterCreate, 200, 'GET /api/prerequisites/:courseId should return added prerequisites');
    assertEqual(getAfterCreate.body?.data?.length, 2, 'GET /api/prerequisites/:courseId should return both prerequisites', getAfterCreate.body);
    assertEqual(getAfterCreate.body?.data?.[0]?.courseCode, refs.prereqOneCode, 'GET /api/prerequisites/:courseId should sort prerequisites by course code', getAfterCreate.body);
    assertEqual(getAfterCreate.body?.data?.[1]?.courseCode, refs.prereqTwoCode, 'GET /api/prerequisites/:courseId should sort prerequisites by course code', getAfterCreate.body);
    logPass('GET /api/prerequisites/:courseId returns added prerequisites in sorted order');

    const createChainStepOne = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.prereqOneId, prerequisiteId: refs.chainCourseId }),
    });
    assertStatus(createChainStepOne, 201, 'POST /api/prerequisites should allow chain setup for cycle testing');

    const cycleCreate = await request('/api/prerequisites', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ courseId: refs.chainCourseId, prerequisiteId: refs.targetCourseId }),
    });
    assertStatus(cycleCreate, 409, 'POST /api/prerequisites should reject cyclical prerequisite relationships');
    logPass('POST /api/prerequisites rejects cyclical prerequisite relationships');

    const deleteAccessCases = [
        {
            options: { method: 'DELETE' },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId should reject missing token',
            successMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId rejects missing token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders('not-a-real-token') },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId should reject invalid token',
            successMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId rejects invalid token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders(ctx.updatedNonAdminAuth.token) },
            expectedStatus: 403,
            failureMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId should reject non-admin user',
            successMessage: 'DELETE /api/prerequisites/:courseId/:prerequisiteId rejects non-admin user',
        },
    ];

    for (const testCase of deleteAccessCases) {
        const res = await request('/api/prerequisites/' + refs.targetCourseId + '/' + refs.prereqOneId, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const missingDelete = await request('/api/prerequisites/' + refs.targetCourseId + '/999999997', {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(missingDelete, 404, 'DELETE /api/prerequisites/:courseId/:prerequisiteId should reject unknown relationships');
    logPass('DELETE /api/prerequisites/:courseId/:prerequisiteId rejects unknown relationships');

    const deleteExisting = await request('/api/prerequisites/' + refs.targetCourseId + '/' + refs.prereqOneId, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteExisting, 200, 'DELETE /api/prerequisites/:courseId/:prerequisiteId should allow admins to remove prerequisites');
    logPass('DELETE /api/prerequisites/:courseId/:prerequisiteId allows admins to remove prerequisites');

    const getAfterDelete = await request('/api/prerequisites/' + refs.targetCourseId);
    assertStatus(getAfterDelete, 200, 'GET /api/prerequisites/:courseId should succeed after deletion');
    assertEqual(getAfterDelete.body?.data?.length, 1, 'GET /api/prerequisites/:courseId should reflect deleted prerequisites', getAfterDelete.body);
    assertEqual(getAfterDelete.body?.data?.[0]?.courseCode, refs.prereqTwoCode, 'GET /api/prerequisites/:courseId should leave the remaining prerequisite intact', getAfterDelete.body);
    logPass('GET /api/prerequisites/:courseId reflects deleted prerequisites');

    await cleanupPrerequisiteRelationships(request, ctx.adminAuth.token, refs);
    await cleanupPrerequisiteCourses(request, ctx.adminAuth.token, refs);
}

async function createPrerequisiteCourseRefs(ctx, request) {
    const now = Date.now();
    const suffix = String(now % 1000).padStart(3, '0');
    const target = await createCourse(request, ctx.adminAuth.token, {
        courseCode: 'PRAA' + suffix,
        courseTitle: 'Prerequisite Target ' + now,
        courseDescription: 'Created by apiTestRunner for prerequisite validation.',
        courseCredits: 3,
    });
    const prereqOne = await createCourse(request, ctx.adminAuth.token, {
        courseCode: 'PRAB' + suffix,
        courseTitle: 'Prerequisite One ' + (now + 1),
        courseDescription: 'Created by apiTestRunner for prerequisite validation.',
        courseCredits: 3,
    });
    const prereqTwo = await createCourse(request, ctx.adminAuth.token, {
        courseCode: 'PRAC' + suffix,
        courseTitle: 'Prerequisite Two ' + (now + 2),
        courseDescription: 'Created by apiTestRunner for prerequisite validation.',
        courseCredits: 3,
    });
    const chainCourse = await createCourse(request, ctx.adminAuth.token, {
        courseCode: 'PRAD' + suffix,
        courseTitle: 'Prerequisite Chain ' + (now + 3),
        courseDescription: 'Created by apiTestRunner for prerequisite validation.',
        courseCredits: 3,
    });

    return {
        targetCourseId: target.course_id,
        prereqOneId: prereqOne.course_id,
        prereqOneCode: prereqOne.course_code,
        prereqTwoId: prereqTwo.course_id,
        prereqTwoCode: prereqTwo.course_code,
        chainCourseId: chainCourse.course_id,
    };
}

async function createCourse(request, adminToken, payload) {
    const res = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify(payload),
    });
    assertStatus(res, 201, 'Test setup should create prerequisite fixture courses');
    assertTruthy(res.body?.course?.course_id, 'Test setup should receive created course ids', res.body);
    return res.body.course;
}

async function cleanupPrerequisiteRelationships(request, adminToken, refs) {
    const relationships = [
        [refs.targetCourseId, refs.prereqTwoId],
        [refs.prereqOneId, refs.chainCourseId],
    ];

    for (const relationship of relationships) {
        const res = await request('/api/prerequisites/' + relationship[0] + '/' + relationship[1], {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        });
        if (res.status !== 200 && res.status !== 404) {
            throw new Error('Prerequisite test cleanup failed. Body: ' + JSON.stringify(res.body));
        }
    }
}

async function cleanupPrerequisiteCourses(request, adminToken, refs) {
    const courseIds = [refs.targetCourseId, refs.prereqOneId, refs.prereqTwoId, refs.chainCourseId];

    for (const courseId of courseIds) {
        const res = await request('/api/courses/' + courseId, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        });
        if (res.status !== 200 && res.status !== 404) {
            throw new Error('Prerequisite course cleanup failed. Body: ' + JSON.stringify(res.body));
        }
    }
}
