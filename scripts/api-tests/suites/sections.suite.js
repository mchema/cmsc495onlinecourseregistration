import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';
import { loginAndGetAuth } from '../auth.js';

export async function runSectionsSuite(ctx, request) {
    const refs = await getSectionRefs(ctx, request);
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
    assertTruthy(hasJsonObjectValue(createSection.body?.section?.access_codes), 'Created section should include JSON access codes', createSection.body);
    const createdSectionAccessCodes = createSection.body.section.access_codes;
    logPass('POST /api/courses/:courseId/sections allows admin user to create sections');

    const getById = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getById, 200, 'GET /api/sections/:sectionId should return created section');
    assertEqual(getById.body?.section?.section_id, createdSectionId, 'GET /api/sections/:sectionId returned wrong section', getById.body);
    assertEqual(getById.body?.section?.days, createPayload.days, 'GET /api/sections/:sectionId should return created section data', getById.body);
    assertEqual(getById.body?.section?.start_time, '09:00:00', 'GET /api/sections/:sectionId should return normalized SQL start times', getById.body);
    assertEqual(getById.body?.section?.access_codes, undefined, 'GET /api/sections/:sectionId should not expose access codes', getById.body);
    logPass('GET /api/sections/:sectionId returns created section');

    const ownerProfessorAuth = await createProfessorAuth(ctx, request, 'owner');
    const unrelatedProfessorAuth = await createProfessorAuth(ctx, request, 'other');
    const professorOwnedSection = await createProfessorOwnedSection(request, ctx.adminAuth.token, createdCourseId, refs, ownerProfessorAuth.user.role_id);
    const professorOwnedSectionId = professorOwnedSection.section_id;
    const professorOwnedSectionAccessCodes = professorOwnedSection.access_codes;

    const accessCodeReadAuthCases = [
        {
            options: undefined,
            expectedStatus: 401,
            failureMessage: 'GET /api/sections/:sectionId/access-codes should reject missing token',
            successMessage: 'GET /api/sections/:sectionId/access-codes rejects missing token',
        },
        {
            options: { headers: authHeaders('not-a-real-token') },
            expectedStatus: 401,
            failureMessage: 'GET /api/sections/:sectionId/access-codes should reject invalid token',
            successMessage: 'GET /api/sections/:sectionId/access-codes rejects invalid token',
        },
        {
            options: { headers: authHeaders(ctx.updatedNonAdminAuth.token) },
            expectedStatus: 403,
            failureMessage: 'GET /api/sections/:sectionId/access-codes should reject student user',
            successMessage: 'GET /api/sections/:sectionId/access-codes rejects student user',
        },
        {
            options: { headers: authHeaders(unrelatedProfessorAuth.token) },
            expectedStatus: 403,
            failureMessage: 'GET /api/sections/:sectionId/access-codes should reject unrelated professor',
            successMessage: 'GET /api/sections/:sectionId/access-codes rejects unrelated professor',
        },
    ];

    for (const testCase of accessCodeReadAuthCases) {
        const res = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const accessCodesMissingSection = await request('/api/sections/999999999/access-codes', {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(accessCodesMissingSection, 404, 'GET /api/sections/:sectionId/access-codes should reject unknown sections');
    logPass('GET /api/sections/:sectionId/access-codes rejects unknown sections');

    const adminAccessCodes = await request(`/api/sections/${createdSectionId}/access-codes`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(adminAccessCodes, 200, 'GET /api/sections/:sectionId/access-codes should allow admin user');
    assertDeepEqualByJson(adminAccessCodes.body?.accessCodes, createdSectionAccessCodes, 'GET /api/sections/:sectionId/access-codes should return created access codes for admin', adminAccessCodes.body);
    logPass('GET /api/sections/:sectionId/access-codes allows admin user');

    const ownerProfessorAccessCodes = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, {
        headers: authHeaders(ownerProfessorAuth.token),
    });
    assertStatus(ownerProfessorAccessCodes, 200, 'GET /api/sections/:sectionId/access-codes should allow owning professor');
    assertDeepEqualByJson(ownerProfessorAccessCodes.body?.accessCodes, professorOwnedSectionAccessCodes, 'GET /api/sections/:sectionId/access-codes should return created access codes for owning professor', ownerProfessorAccessCodes.body);
    logPass('GET /api/sections/:sectionId/access-codes allows owning professor');

    const generateAccessCodeAuthCases = [
        {
            options: { method: 'POST', body: JSON.stringify({ numCodes: 2 }) },
            expectedStatus: 401,
            failureMessage: 'POST /api/sections/:sectionId/access-codes should reject missing token',
            successMessage: 'POST /api/sections/:sectionId/access-codes rejects missing token',
        },
        {
            options: { method: 'POST', headers: authHeaders('not-a-real-token'), body: JSON.stringify({ numCodes: 2 }) },
            expectedStatus: 401,
            failureMessage: 'POST /api/sections/:sectionId/access-codes should reject invalid token',
            successMessage: 'POST /api/sections/:sectionId/access-codes rejects invalid token',
        },
        {
            options: { method: 'POST', headers: authHeaders(ctx.updatedNonAdminAuth.token), body: JSON.stringify({ numCodes: 2 }) },
            expectedStatus: 403,
            failureMessage: 'POST /api/sections/:sectionId/access-codes should reject student user',
            successMessage: 'POST /api/sections/:sectionId/access-codes rejects student user',
        },
        {
            options: { method: 'POST', headers: authHeaders(unrelatedProfessorAuth.token), body: JSON.stringify({ numCodes: 2 }) },
            expectedStatus: 403,
            failureMessage: 'POST /api/sections/:sectionId/access-codes should reject unrelated professor',
            successMessage: 'POST /api/sections/:sectionId/access-codes rejects unrelated professor',
        },
    ];

    for (const testCase of generateAccessCodeAuthCases) {
        const res = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidGenerateBody = await request(`/api/sections/${createdSectionId}/access-codes`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ numCodes: 0 }),
    });
    assertStatus(invalidGenerateBody, 400, 'POST /api/sections/:sectionId/access-codes should reject invalid numCodes');
    logPass('POST /api/sections/:sectionId/access-codes rejects invalid numCodes');

    const generateMissingSection = await request('/api/sections/999999999/access-codes', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ numCodes: 1 }),
    });
    assertStatus(generateMissingSection, 404, 'POST /api/sections/:sectionId/access-codes should reject unknown sections');
    logPass('POST /api/sections/:sectionId/access-codes rejects unknown sections');

    const adminGenerateCodes = await request(`/api/sections/${createdSectionId}/access-codes`, {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ numCodes: 2 }),
    });
    assertStatus(adminGenerateCodes, 200, 'POST /api/sections/:sectionId/access-codes should allow admin user');
    assertEqual(countAccessCodeValues(adminGenerateCodes.body?.newAccessCodes), 2, 'POST /api/sections/:sectionId/access-codes should return requested number of new codes for admin', adminGenerateCodes.body);
    logPass('POST /api/sections/:sectionId/access-codes allows admin user');

    const adminAccessCodesAfterGenerate = await request(`/api/sections/${createdSectionId}/access-codes`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(adminAccessCodesAfterGenerate, 200, 'GET /api/sections/:sectionId/access-codes should reflect generated admin codes');
    assertEqual(countAccessCodeValues(adminAccessCodesAfterGenerate.body?.accessCodes), countAccessCodeValues(createdSectionAccessCodes) + 2, 'GET /api/sections/:sectionId/access-codes should include newly generated admin codes', adminAccessCodesAfterGenerate.body);
    assertTruthy(hasAllAccessCodeEntries(adminAccessCodesAfterGenerate.body?.accessCodes, createdSectionAccessCodes), 'Existing admin access codes should remain after generation', adminAccessCodesAfterGenerate.body);
    logPass('GET /api/sections/:sectionId/access-codes reflects admin-generated codes');

    const ownerGenerateCodes = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, {
        method: 'POST',
        headers: authHeaders(ownerProfessorAuth.token),
        body: JSON.stringify({ numCodes: 1 }),
    });
    assertStatus(ownerGenerateCodes, 200, 'POST /api/sections/:sectionId/access-codes should allow owning professor');
    assertEqual(countAccessCodeValues(ownerGenerateCodes.body?.newAccessCodes), 1, 'POST /api/sections/:sectionId/access-codes should return requested number of new codes for owning professor', ownerGenerateCodes.body);
    logPass('POST /api/sections/:sectionId/access-codes allows owning professor');

    const ownerAccessCodesAfterGenerate = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, {
        headers: authHeaders(ownerProfessorAuth.token),
    });
    assertStatus(ownerAccessCodesAfterGenerate, 200, 'GET /api/sections/:sectionId/access-codes should reflect professor-generated codes');
    assertEqual(countAccessCodeValues(ownerAccessCodesAfterGenerate.body?.accessCodes), countAccessCodeValues(professorOwnedSectionAccessCodes) + 1, 'GET /api/sections/:sectionId/access-codes should include newly generated professor codes', ownerAccessCodesAfterGenerate.body);
    assertTruthy(hasAllAccessCodeEntries(ownerAccessCodesAfterGenerate.body?.accessCodes, professorOwnedSectionAccessCodes), 'Existing professor access codes should remain after generation', ownerAccessCodesAfterGenerate.body);
    logPass('GET /api/sections/:sectionId/access-codes reflects professor-generated codes');

    const codeToRevokeByAdmin = firstAccessCodeValue(adminAccessCodesAfterGenerate.body?.accessCodes);
    const codeToRevokeByOwner = firstAccessCodeValue(ownerAccessCodesAfterGenerate.body?.accessCodes);

    const revokeAccessCodeAuthCases = [
        {
            options: { method: 'DELETE', body: JSON.stringify({ codesToRevoke: [codeToRevokeByOwner] }) },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/sections/:sectionId/access-codes should reject missing token',
            successMessage: 'DELETE /api/sections/:sectionId/access-codes rejects missing token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders('not-a-real-token'), body: JSON.stringify({ codesToRevoke: [codeToRevokeByOwner] }) },
            expectedStatus: 401,
            failureMessage: 'DELETE /api/sections/:sectionId/access-codes should reject invalid token',
            successMessage: 'DELETE /api/sections/:sectionId/access-codes rejects invalid token',
        },
        {
            options: { method: 'DELETE', headers: authHeaders(ctx.updatedNonAdminAuth.token), body: JSON.stringify({ codesToRevoke: [codeToRevokeByOwner] }) },
            expectedStatus: 403,
            failureMessage: 'DELETE /api/sections/:sectionId/access-codes should reject student user',
            successMessage: 'DELETE /api/sections/:sectionId/access-codes rejects student user',
        },
        {
            options: { method: 'DELETE', headers: authHeaders(unrelatedProfessorAuth.token), body: JSON.stringify({ codesToRevoke: [codeToRevokeByOwner] }) },
            expectedStatus: 403,
            failureMessage: 'DELETE /api/sections/:sectionId/access-codes should reject unrelated professor',
            successMessage: 'DELETE /api/sections/:sectionId/access-codes rejects unrelated professor',
        },
    ];

    for (const testCase of revokeAccessCodeAuthCases) {
        const res = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, testCase.options);
        assertStatus(res, testCase.expectedStatus, testCase.failureMessage);
        logPass(testCase.successMessage);
    }

    const invalidRevokeBody = await request(`/api/sections/${createdSectionId}/access-codes`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ codesToRevoke: [] }),
    });
    assertStatus(invalidRevokeBody, 400, 'DELETE /api/sections/:sectionId/access-codes should reject empty revoke lists');
    logPass('DELETE /api/sections/:sectionId/access-codes rejects empty revoke lists');

    const revokeMissingSection = await request('/api/sections/999999999/access-codes', {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ codesToRevoke: [codeToRevokeByAdmin] }),
    });
    assertStatus(revokeMissingSection, 404, 'DELETE /api/sections/:sectionId/access-codes should reject unknown sections');
    logPass('DELETE /api/sections/:sectionId/access-codes rejects unknown sections');

    const adminRevokeCodes = await request(`/api/sections/${createdSectionId}/access-codes`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ codesToRevoke: [codeToRevokeByAdmin] }),
    });
    assertStatus(adminRevokeCodes, 200, 'DELETE /api/sections/:sectionId/access-codes should allow admin user');
    logPass('DELETE /api/sections/:sectionId/access-codes allows admin user');

    const adminAccessCodesAfterRevoke = await request(`/api/sections/${createdSectionId}/access-codes`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(adminAccessCodesAfterRevoke, 200, 'GET /api/sections/:sectionId/access-codes should reflect revoked admin codes');
    assertTruthy(!hasAccessCodeValue(adminAccessCodesAfterRevoke.body?.accessCodes, codeToRevokeByAdmin), 'Revoked admin access code should no longer be returned', adminAccessCodesAfterRevoke.body);
    logPass('GET /api/sections/:sectionId/access-codes reflects revoked admin codes');

    const ownerRevokeCodes = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, {
        method: 'DELETE',
        headers: authHeaders(ownerProfessorAuth.token),
        body: JSON.stringify({ codesToRevoke: [codeToRevokeByOwner] }),
    });
    assertStatus(ownerRevokeCodes, 200, 'DELETE /api/sections/:sectionId/access-codes should allow owning professor');
    logPass('DELETE /api/sections/:sectionId/access-codes allows owning professor');

    const ownerAccessCodesAfterRevoke = await request(`/api/sections/${professorOwnedSectionId}/access-codes`, {
        headers: authHeaders(ownerProfessorAuth.token),
    });
    assertStatus(ownerAccessCodesAfterRevoke, 200, 'GET /api/sections/:sectionId/access-codes should reflect revoked professor codes');
    assertTruthy(!hasAccessCodeValue(ownerAccessCodesAfterRevoke.body?.accessCodes, codeToRevokeByOwner), 'Revoked professor access code should no longer be returned', ownerAccessCodesAfterRevoke.body);
    logPass('GET /api/sections/:sectionId/access-codes reflects revoked professor codes');

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
        semesterId: refs.semesterId,
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
    assertEqual(updateSection.body?.section?.semester_id, refs.semesterId, 'PATCH /api/sections/:sectionId should preserve semester when unchanged', updateSection.body);
    assertEqual(updateSection.body?.section?.capacity, updatePayload.capacity, 'PATCH /api/sections/:sectionId should update capacity', updateSection.body);
    assertEqual(updateSection.body?.section?.days, updatePayload.days, 'PATCH /api/sections/:sectionId should update meeting days', updateSection.body);
    assertEqual(updateSection.body?.section?.start_time, '13:30:00', 'PATCH /api/sections/:sectionId should persist normalized SQL start times', updateSection.body);
    assertEqual(updateSection.body?.section?.end_time, '14:45:00', 'PATCH /api/sections/:sectionId should persist normalized SQL end times', updateSection.body);
    assertEqual(updateSection.body?.section?.access_codes, undefined, 'PATCH /api/sections/:sectionId should not expose access codes', updateSection.body);
    logPass('PATCH /api/sections/:sectionId allows admin user to update sections');

    const getAfterUpdate = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getAfterUpdate, 200, 'GET /api/sections/:sectionId should return updated section');
    assertEqual(getAfterUpdate.body?.section?.semester_id, refs.semesterId, 'GET /api/sections/:sectionId should preserve semester when unchanged', getAfterUpdate.body);
    assertEqual(getAfterUpdate.body?.section?.days, updatePayload.days, 'GET /api/sections/:sectionId should reflect updated meeting days', getAfterUpdate.body);
    assertEqual(getAfterUpdate.body?.section?.access_codes, undefined, 'GET /api/sections/:sectionId should not expose access codes after update', getAfterUpdate.body);
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

    const deleteGuardStudentOne = await createStudentAuth(ctx, request, 'delete_guard_one');
    const deleteGuardStudentTwo = await createStudentAuth(ctx, request, 'delete_guard_two');
    const deleteGuardEnrollmentOne = await createEnrollment(request, ctx.adminAuth.token, deleteGuardStudentOne.user.role_id, createdSectionId);
    const deleteGuardEnrollmentTwo = await createEnrollment(request, ctx.adminAuth.token, deleteGuardStudentTwo.user.role_id, createdSectionId);

    const capacityReductionBlocked = await request(`/api/sections/${createdSectionId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ ...updatePayload, capacity: 1 }),
    });
    assertStatus(capacityReductionBlocked, 400, 'PATCH /api/sections/:sectionId should reject reducing capacity below current enrolled count');
    logPass('PATCH /api/sections/:sectionId rejects capacity reductions below current enrolled count');

    const deleteBlockedSection = await request(`/api/sections/${createdSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteBlockedSection, 400, 'DELETE /api/sections/:sectionId should reject deletion when enrollments exist');
    logPass('DELETE /api/sections/:sectionId rejects deletion when enrollments exist');

    await deleteEnrollmentIfExists(request, ctx.adminAuth.token, deleteGuardEnrollmentOne.enrollment_id);
    await deleteEnrollmentIfExists(request, ctx.adminAuth.token, deleteGuardEnrollmentTwo.enrollment_id);

    const deleteSection = await request(`/api/sections/${createdSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteSection, 200, 'DELETE /api/sections/:sectionId should allow admin user');
    logPass('DELETE /api/sections/:sectionId allows admin user to delete sections');

    const getAfterDelete = await request(`/api/sections/${createdSectionId}`);
    assertStatus(getAfterDelete, 404, 'GET /api/sections/:sectionId should return 404 after deletion');
    logPass('GET /api/sections/:sectionId returns 404 after deletion');

    const deleteProfessorOwnedSection = await request(`/api/sections/${professorOwnedSectionId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteProfessorOwnedSection, 200, 'DELETE /api/sections/:sectionId should clean up professor-owned section');

    const deleteCourse = await request(`/api/courses/${createdCourseId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteCourse, 200, 'DELETE /api/courses/:courseId should clean up section test course');

    const deleteOwnerProfessor = await request(`/api/admin/users/${ownerProfessorAuth.user.id}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteOwnerProfessor, 200, 'DELETE /api/admin/users/:id should clean up owner professor user');

    const deleteOtherProfessor = await request(`/api/admin/users/${unrelatedProfessorAuth.user.id}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteOtherProfessor, 200, 'DELETE /api/admin/users/:id should clean up unrelated professor user');

    await deleteUserIfExists(request, ctx.adminAuth.token, refs.professorUserId);
    await deleteUserIfExists(request, ctx.adminAuth.token, deleteGuardStudentOne.user.id);
    await deleteUserIfExists(request, ctx.adminAuth.token, deleteGuardStudentTwo.user.id);

    const deleteSemester = await request(`/api/semesters/${refs.semesterId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteSemester, 200, 'DELETE /api/semesters/:semesterId should clean up section test semester');
}

async function getSectionRefs(ctx, request) {
    const semesterId = await createSemesterForSectionTests(ctx, request);
    const professorAuth = await createProfessorAuth(ctx, request, 'base');

    return {
        semesterId,
        professorId: professorAuth.user.role_id,
        professorUserId: professorAuth.user.id,
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

async function createProfessorAuth(ctx, request, label) {
    const now = Date.now();
    const name = `SecProf ${label} ${now}`;
    const email = `section_${label}_prof_${now}@gmail.com`;
    const password = `SectionProf!${now}Aa1`;

    const createProfessor = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({
            name,
            email,
            userType: 'PROFESSOR',
            roleDetails: 'Computer Science',
        }),
    });
    assertStatus(createProfessor, 201, 'POST /api/admin/users should create professor users for access-code tests');

    const firstLoginAuth = await loginAndGetAuth(request, email, name + email);
    const passwordChange = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(firstLoginAuth.token),
        body: JSON.stringify({ newPassword: password }),
    });
    assertStatus(passwordChange, 200, 'POST /api/auth/change-password should activate professor users for access-code tests');

    return loginAndGetAuth(request, email, password);
}

async function createStudentAuth(ctx, request, label) {
    const now = Date.now();
    const name = `SecStud ${label} ${now}`;
    const email = `section_${label}_student_${now}@gmail.com`;
    const password = `SectionStudent!${now}Aa1`;

    const createStudent = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({
            name,
            email,
            userType: 'STUDENT',
            roleDetails: 'Computer Science',
        }),
    });
    assertStatus(createStudent, 201, 'POST /api/admin/users should create student users for section tests');

    const firstLoginAuth = await loginAndGetAuth(request, email, name + email);
    const passwordChange = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(firstLoginAuth.token),
        body: JSON.stringify({ newPassword: password }),
    });
    assertStatus(passwordChange, 200, 'POST /api/auth/change-password should activate student users for section tests');

    return loginAndGetAuth(request, email, password);
}

async function createEnrollment(request, adminToken, studentId, sectionId) {
    const res = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({ studentId, sectionId }),
    });
    assertStatus(res, 201, 'Section test setup should create enrollment fixtures');
    return res.body.enrollment;
}

async function createSemesterForSectionTests(ctx, request) {
    const payload = {
        term: 'SECT',
        year: 2080 + Number(String(Date.now()).slice(-1)),
    };

    const res = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(payload),
    });
    assertStatus(res, 201, 'POST /api/semesters should create semester fixtures for section tests');
    return res.body.semester.semester_id;
}

async function deleteEnrollmentIfExists(request, adminToken, enrollmentId) {
    const res = await request('/api/enrollments/' + enrollmentId, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
    });

    if (![200, 404].includes(res.status)) {
        throw new Error(`Section enrollment cleanup failed for ${enrollmentId}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }
}

async function deleteUserIfExists(request, adminToken, userId) {
    const res = await request('/api/admin/users/' + userId, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
    });

    if (![200, 404].includes(res.status)) {
        throw new Error(`Section user cleanup failed for ${userId}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }
}

async function createProfessorOwnedSection(request, adminToken, courseId, refs, professorId) {
    const res = await request(`/api/courses/${courseId}/sections`, {
        method: 'POST',
        headers: authHeaders(adminToken),
        body: JSON.stringify({
            semesterId: refs.semesterId,
            professorId,
            capacity: 16,
            days: 'TR',
            startTime: '11:00',
            endTime: '12:15',
        }),
    });

    assertStatus(res, 201, 'POST /api/courses/:courseId/sections should create professor-owned access-code test sections');
    assertTruthy(res.body?.section?.section_id, 'Professor-owned section id should be present', res.body);

    return res.body.section;
}

function hasJsonObjectValue(value) {
    if (!value) {
        return false;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return true;
    }

    if (typeof value !== 'string') {
        return false;
    }

    try {
        const parsed = JSON.parse(value);
        return Boolean(parsed) && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
        return false;
    }
}

function countAccessCodeValues(accessCodes) {
    return Object.keys(accessCodes ?? {}).filter((key) => /^code\d+$/.test(key)).length;
}

function firstAccessCodeValue(accessCodes) {
    const firstKey = Object.keys(accessCodes ?? {}).find((key) => /^code\d+$/.test(key));
    return firstKey ? accessCodes[firstKey] : null;
}

function hasAccessCodeValue(accessCodes, code) {
    return Object.keys(accessCodes ?? {}).some((key) => /^code\d+$/.test(key) && accessCodes[key] === code);
}

function hasAllAccessCodeEntries(actual, expected) {
    return Object.entries(expected ?? {}).every(([key, value]) => actual?.[key] === value);
}

function assertDeepEqualByJson(actual, expected, message, payload = { actual, expected }) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}. Payload: ${JSON.stringify(payload)}`);
    }
}
