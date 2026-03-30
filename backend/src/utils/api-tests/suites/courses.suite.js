import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';

export async function runCoursesSuite(ctx, request) {
    const createWithoutToken = await request('/api/courses', {
        method: 'POST',
        body: JSON.stringify(ctx.courseTest.create),
    });
    assertStatus(createWithoutToken, 401, 'POST /api/courses should reject missing token');
    logPass('POST /api/courses rejects missing token');

    const createWithInvalidToken = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders('not-a-real-token'),
        body: JSON.stringify(ctx.courseTest.create),
    });
    assertStatus(createWithInvalidToken, 401, 'POST /api/courses should reject invalid token');
    logPass('POST /api/courses rejects invalid token');

    const createWithNonAdminToken = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify(ctx.courseTest.create),
    });
    assertStatus(createWithNonAdminToken, 403, 'POST /api/courses should reject non-admin user');
    logPass('POST /api/courses rejects non-admin user');

    const createWithAdminToken = await request('/api/courses', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(ctx.courseTest.create),
    });
    assertStatus(createWithAdminToken, 201, 'POST /api/courses should allow admin user');

    ctx.createdCourseId = createWithAdminToken.body?.course?.course_id;
    assertTruthy(ctx.createdCourseId, 'Missing created course id', createWithAdminToken.body);
    assertEqual(createWithAdminToken.body?.course?.course_code, ctx.courseTest.create.courseCode, 'Unexpected created course code', createWithAdminToken.body);
    logPass('POST /api/courses allows admin user to create course');

    const getById = await request(`/api/courses/${ctx.createdCourseId}`);
    assertStatus(getById, 200, 'GET /api/courses/:courseId should return created course');
    assertEqual(getById.body?.course_id, ctx.createdCourseId, 'Unexpected course_id from GET /api/courses/:courseId', getById.body);
    assertEqual(getById.body?.course_code, ctx.courseTest.create.courseCode, 'Unexpected course_code from GET /api/courses/:courseId', getById.body);
    logPass('GET /api/courses/:courseId returns created course');

    const updateWithoutToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'PATCH',
        body: JSON.stringify(ctx.courseTest.update),
    });
    assertStatus(updateWithoutToken, 401, 'PATCH /api/courses/:courseId should reject missing token');
    logPass('PATCH /api/courses/:courseId rejects missing token');

    const updateWithInvalidToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'PATCH',
        headers: authHeaders('not-a-real-token'),
        body: JSON.stringify(ctx.courseTest.update),
    });
    assertStatus(updateWithInvalidToken, 401, 'PATCH /api/courses/:courseId should reject invalid token');
    logPass('PATCH /api/courses/:courseId rejects invalid token');

    const updateWithNonAdminToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify(ctx.courseTest.update),
    });
    assertStatus(updateWithNonAdminToken, 403, 'PATCH /api/courses/:courseId should reject non-admin user');
    logPass('PATCH /api/courses/:courseId rejects non-admin user');

    const updateWithAdminToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(ctx.courseTest.update),
    });
    assertStatus(updateWithAdminToken, 200, 'PATCH /api/courses/:courseId should allow admin user');
    assertTruthy(updateWithAdminToken.body?.course?.course_id, 'Missing updated course payload', updateWithAdminToken.body);
    assertEqual(updateWithAdminToken.body?.course?.course_code, ctx.courseTest.update.courseCode, 'Course code was not updated', updateWithAdminToken.body);
    assertEqual(updateWithAdminToken.body?.course?.title, ctx.courseTest.update.courseTitle, 'Course title was not updated', updateWithAdminToken.body);
    logPass('PATCH /api/courses/:courseId allows admin user to update course');

    const getByIdAfterUpdate = await request(`/api/courses/${ctx.createdCourseId}`);
    assertStatus(getByIdAfterUpdate, 200, 'GET /api/courses/:courseId should return updated course');
    assertEqual(getByIdAfterUpdate.body?.course_code, ctx.courseTest.update.courseCode, 'Updated course code not reflected in GET', getByIdAfterUpdate.body);
    assertEqual(getByIdAfterUpdate.body?.title, ctx.courseTest.update.courseTitle, 'Updated course title not reflected in GET', getByIdAfterUpdate.body);
    assertEqual(Number(getByIdAfterUpdate.body?.credits), ctx.courseTest.update.courseCredits, 'Updated course credits not reflected in GET', getByIdAfterUpdate.body);
    logPass('GET /api/courses/:courseId reflects updated course data');

    const deleteWithoutToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'DELETE',
    });
    assertStatus(deleteWithoutToken, 401, 'DELETE /api/courses/:courseId should reject missing token');
    logPass('DELETE /api/courses/:courseId rejects missing token');

    const deleteWithInvalidToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'DELETE',
        headers: authHeaders('not-a-real-token'),
    });
    assertStatus(deleteWithInvalidToken, 401, 'DELETE /api/courses/:courseId should reject invalid token');
    logPass('DELETE /api/courses/:courseId rejects invalid token');

    const deleteWithNonAdminToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(deleteWithNonAdminToken, 403, 'DELETE /api/courses/:courseId should reject non-admin user');
    logPass('DELETE /api/courses/:courseId rejects non-admin user');

    const deleteWithAdminToken = await request(`/api/courses/${ctx.createdCourseId}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteWithAdminToken, 200, 'DELETE /api/courses/:courseId should allow admin user');
    logPass('DELETE /api/courses/:courseId allows admin user to delete course');

    const getAfterDelete = await request(`/api/courses/${ctx.createdCourseId}`);
    assertStatus(getAfterDelete, 404, 'GET /api/courses/:courseId should return 404 after deletion');
    logPass('GET /api/courses/:courseId returns 404 after deletion');
}
