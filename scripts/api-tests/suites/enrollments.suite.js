import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { loginAndGetAuth } from '../auth.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';

export async function runEnrollmentsSuite(ctx, request) {
    const refs = await getEnrollmentRefs(ctx, request);
    const accessCodeStudentAuth = await createStudentAuth(ctx, request, 'access');

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
    refs.enrollmentIds.push(selfEnrollmentId);
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
    refs.enrollmentIds.push(otherStudentEnrollment.enrollment_id);
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

    const prereqEnrollment = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[1], refs.prereqSectionId);
    refs.enrollmentIds.push(prereqEnrollment.enrollment_id);
    const completePrereqEnrollment = await request('/api/enrollments/' + prereqEnrollment.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ status: 'completed' }),
    });
    assertStatus(completePrereqEnrollment, 200, 'PATCH /api/enrollments/:enrollmentId should allow admins to complete prerequisite enrollments during test setup');

    const metPrerequisiteCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[1], sectionId: refs.targetSectionId }),
    });
    assertStatus(metPrerequisiteCreate, 201, 'POST /api/enrollments should allow students who completed prerequisites');
    refs.enrollmentIds.push(metPrerequisiteCreate.body?.enrollment?.enrollment_id);
    assertEqual(metPrerequisiteCreate.body?.enrollment?.status, 'enrolled', 'POST /api/enrollments should enroll students who meet prerequisites', metPrerequisiteCreate.body);
    logPass('POST /api/enrollments allows students who completed prerequisites');

    const capacityOne = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[2], refs.limitedSectionId);
    refs.enrollmentIds.push(capacityOne.enrollment_id);
    assertEqual(capacityOne.status, 'enrolled', 'First enrollment in a limited section should be enrolled', capacityOne);
    const waitlistOne = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[3], refs.limitedSectionId);
    refs.enrollmentIds.push(waitlistOne.enrollment_id);
    assertEqual(waitlistOne.status, 'waitlisted', 'Second enrollment in a full section should be waitlisted', waitlistOne);
    const waitlistTwo = await createEnrollment(request, ctx.adminAuth.token, refs.studentIds[4], refs.limitedSectionId);
    refs.enrollmentIds.push(waitlistTwo.enrollment_id);
    assertEqual(waitlistTwo.status, 'waitlisted', 'Third enrollment in a full section should be waitlisted', waitlistTwo);
    const waitlistThree = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(accessCodeStudentAuth.token),
        body: JSON.stringify({ studentId: accessCodeStudentAuth.user.role_id, sectionId: refs.limitedSectionId }),
    });
    assertStatus(waitlistThree, 201, 'POST /api/enrollments should let students join a full-section waitlist');
    refs.enrollmentIds.push(waitlistThree.body?.enrollment?.enrollment_id);
    assertEqual(waitlistThree.body?.enrollment?.status, 'waitlisted', 'Fourth enrollment in a full section should be waitlisted', waitlistThree.body);
    logPass('POST /api/enrollments applies waitlist behavior after section capacity is reached');

    const sectionFullCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[5], sectionId: refs.limitedSectionId }),
    });
    assertStatus(sectionFullCreate, 409, 'POST /api/enrollments should reject enrollment when waitlist is full');
    logPass('POST /api/enrollments rejects enrollment when waitlist is full');

    const adminDropEnrolled = await request('/api/enrollments/' + capacityOne.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ status: 'dropped' }),
    });
    assertStatus(adminDropEnrolled, 200, 'PATCH /api/enrollments/:enrollmentId should allow admins to drop enrolled students');
    logPass('PATCH /api/enrollments/:enrollmentId allows admins to drop enrolled students');

    const getPromotedWaitlist = await request('/api/enrollments/' + waitlistOne.enrollment_id, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getPromotedWaitlist, 200, 'GET /api/enrollments/:enrollmentId should allow admins to read promoted waitlist records');
    assertEqual(getPromotedWaitlist.body?.enrollment?.status, 'enrolled', 'PATCH /api/enrollments/:enrollmentId should promote the next waitlisted student when a seat opens', getPromotedWaitlist.body);
    logPass('PATCH /api/enrollments/:enrollmentId promotes the next waitlisted student when a seat opens');

    const recycledWaitlistCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[6], sectionId: refs.limitedSectionId }),
    });
    assertStatus(recycledWaitlistCreate, 201, 'POST /api/enrollments should allow new waitlist entries after promotion rebalances a section');
    refs.enrollmentIds.push(recycledWaitlistCreate.body?.enrollment?.enrollment_id);
    assertEqual(recycledWaitlistCreate.body?.enrollment?.status, 'waitlisted', 'POST /api/enrollments should still create waitlisted records after promoting earlier waitlist entries', recycledWaitlistCreate.body);
    logPass('POST /api/enrollments supports new waitlist entries after promotion rebalances a section');

    const limitedSectionAccessCodes = await request(`/api/sections/${refs.limitedSectionId}/access-codes`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(limitedSectionAccessCodes, 200, 'GET /api/sections/:sectionId/access-codes should expose enrollment test access codes to admins');
    const accessCodeValues = Object.keys(limitedSectionAccessCodes.body?.accessCodes ?? {})
        .filter((key) => /^code\d+$/.test(key))
        .map((key) => limitedSectionAccessCodes.body.accessCodes[key]);
    assertTruthy(accessCodeValues.length >= 2, 'Enrollment access-code tests require at least two available section access codes', limitedSectionAccessCodes.body);

    const accessCodeCreate = await request('/api/enrollments', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ studentId: refs.studentIds[5], sectionId: refs.limitedSectionId, accessCode: accessCodeValues[0] }),
    });
    assertStatus(accessCodeCreate, 201, 'POST /api/enrollments should allow access-code overrides into full sections');
    refs.enrollmentIds.push(accessCodeCreate.body?.enrollment?.enrollment_id);
    assertEqual(accessCodeCreate.body?.enrollment?.status, 'enrolled', 'POST /api/enrollments should create enrolled records when a valid access code is used', accessCodeCreate.body);
    logPass('POST /api/enrollments allows valid access-code overrides into enrolled status');

    const studentAccessCodePromotion = await request('/api/enrollments/' + waitlistThree.body.enrollment.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(accessCodeStudentAuth.token),
        body: JSON.stringify({ status: 'enrolled', accessCode: accessCodeValues[1] }),
    });
    assertStatus(studentAccessCodePromotion, 200, 'PATCH /api/enrollments/:enrollmentId should allow students to use access codes for waitlist promotion');
    assertEqual(studentAccessCodePromotion.body?.enrollment?.status, 'enrolled', 'PATCH /api/enrollments/:enrollmentId should move waitlisted students to enrolled with a valid access code', studentAccessCodePromotion.body);
    logPass('PATCH /api/enrollments/:enrollmentId allows student access-code promotion from waitlisted to enrolled');

    const invalidAdminCompleteWaitlisted = await request('/api/enrollments/' + waitlistTwo.enrollment_id, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ status: 'completed' }),
    });
    assertStatus(invalidAdminCompleteWaitlisted, 400, 'PATCH /api/enrollments/:enrollmentId should reject marking waitlisted students completed');
    logPass('PATCH /api/enrollments/:enrollmentId rejects invalid admin completion transitions');

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
    assertStatus(studentDeleteOwn, 403, 'DELETE /api/enrollments/:enrollmentId should prevent students from deleting their own enrollments');
    logPass('DELETE /api/enrollments/:enrollmentId prevents students from deleting their own enrollments');

    const getAfterDelete = await request('/api/enrollments/' + selfEnrollmentId, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getAfterDelete, 200, 'GET /api/enrollments/:enrollmentId should preserve enrollment history after delete is rejected');
    assertEqual(getAfterDelete.body?.enrollment?.status, 'dropped', 'GET /api/enrollments/:enrollmentId should still show dropped status after a rejected student delete', getAfterDelete.body);
    logPass('GET /api/enrollments/:enrollmentId preserves enrollment history after rejected student delete');

    await cleanupEnrollmentFixtures(ctx, request, refs, accessCodeStudentAuth.user.id);
}

async function getEnrollmentRefs(ctx, request) {
    const semesterId = await createSemesterForTests(ctx, request, 'ENROLLMENT');
    const professorAuth = await createProfessorAuth(ctx, request, 'enrollment_base');
    const studentAuths = [];

    for (let i = 0; i < 7; i++) {
        studentAuths.push(await createStudentAuth(ctx, request, 'fixture_' + i));
    }

    const prereqCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRA', 'Enrollment Prereq');
    const targetCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRB', 'Enrollment Target');
    const baseCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRC', 'Enrollment Base');
    const limitedCourseId = await createCourseForEnrollmentTests(ctx, request, 'ENRD', 'Enrollment Limited');

    const sectionRefs = {
        semesterId,
        professorId: professorAuth.user.role_id,
    };

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
        studentIds: studentAuths.map((auth) => auth.user.role_id),
        studentUserIds: studentAuths.map((auth) => auth.user.id),
        selfStudentId: ctx.updatedNonAdminAuth.user.role_id,
        semesterId,
        professorUserId: professorAuth.user.id,
        professorId: professorAuth.user.role_id,
        prereqCourseId,
        targetCourseId,
        baseCourseId,
        limitedCourseId,
        prereqSectionId,
        targetSectionId,
        baseSectionId,
        limitedSectionId,
        enrollmentIds: [],
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

async function createStudentAuth(ctx, request, label) {
    const now = Date.now();
    const name = `EnrStud ${label} ${now}`;
    const email = `enrollment_${label}_student_${now}@gmail.com`;
    const password = `EnrollmentStudent!${now}Aa1`;

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
    assertStatus(createStudent, 201, 'POST /api/admin/users should create student users for enrollment tests');

    const firstLoginAuth = await loginAndGetAuth(request, email, name + email);
    const passwordChange = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(firstLoginAuth.token),
        body: JSON.stringify({ newPassword: password }),
    });
    assertStatus(passwordChange, 200, 'POST /api/auth/change-password should activate student users for enrollment tests');

    return loginAndGetAuth(request, email, password);
}

async function createProfessorAuth(ctx, request, label) {
    const now = Date.now();
    const name = `EnrProf ${label} ${now}`;
    const email = `enrollment_${label}_prof_${now}@gmail.com`;
    const password = `EnrollmentProf!${now}Aa1`;

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
    assertStatus(createProfessor, 201, 'POST /api/admin/users should create professor users for enrollment tests');

    const firstLoginAuth = await loginAndGetAuth(request, email, name + email);
    const passwordChange = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(firstLoginAuth.token),
        body: JSON.stringify({ newPassword: password }),
    });
    assertStatus(passwordChange, 200, 'POST /api/auth/change-password should activate professor users for enrollment tests');

    return loginAndGetAuth(request, email, password);
}

async function createSemesterForTests(ctx, request, termPrefix) {
    const payload = {
        term: String(termPrefix).slice(0, 4).toUpperCase(),
        year: 2090 + Number(String(Date.now()).slice(-1)),
    };

    const res = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(payload),
    });
    assertStatus(res, 201, 'Enrollment tests should create semester fixtures');
    return res.body.semester.semester_id;
}

async function deleteEnrollmentIfExists(request, adminToken, enrollmentId) {
    if (!enrollmentId) {
        return;
    }

    const res = await request('/api/enrollments/' + enrollmentId, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
    });

    if (![200, 404].includes(res.status)) {
        throw new Error(`Enrollment cleanup failed for ${enrollmentId}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }
}

async function deleteUserIfExists(request, adminToken, userId) {
    if (!userId) {
        return;
    }

    const res = await request('/api/admin/users/' + userId, {
        method: 'DELETE',
        headers: authHeaders(adminToken),
    });

    if (![200, 404].includes(res.status)) {
        throw new Error(`User cleanup failed for ${userId}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }
}

async function cleanupEnrollmentFixtures(ctx, request, refs, accessCodeStudentUserId) {
    for (const enrollmentId of [...new Set(refs.enrollmentIds)].reverse()) {
        await deleteEnrollmentIfExists(request, ctx.adminAuth.token, enrollmentId);
    }

    await request('/api/prerequisites/' + refs.targetCourseId + '/' + refs.prereqCourseId, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });

    for (const sectionId of [refs.prereqSectionId, refs.targetSectionId, refs.baseSectionId, refs.limitedSectionId]) {
        await request('/api/sections/' + sectionId, {
            method: 'DELETE',
            headers: authHeaders(ctx.adminAuth.token),
        });
    }

    for (const courseId of [refs.prereqCourseId, refs.targetCourseId, refs.baseCourseId, refs.limitedCourseId]) {
        await request('/api/courses/' + courseId, {
            method: 'DELETE',
            headers: authHeaders(ctx.adminAuth.token),
        });
    }

    await deleteUserIfExists(request, ctx.adminAuth.token, refs.professorUserId);
    for (const userId of refs.studentUserIds) {
        await deleteUserIfExists(request, ctx.adminAuth.token, userId);
    }
    await deleteUserIfExists(request, ctx.adminAuth.token, accessCodeStudentUserId);

    await request('/api/semesters/' + refs.semesterId, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
}
