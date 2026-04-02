import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { logPass } from '../logger.js';

export async function runSemestersSuite(ctx, request) {
    const publicList = await request('/api/semesters');
    assertStatus(publicList, 200, 'GET /api/semesters should return a public semester list');
    assertTruthy(Array.isArray(publicList.body?.semesters), 'GET /api/semesters should return a semesters array', publicList.body);
    logPass('GET /api/semesters returns public results');

    const createPayload = {
        term: 'API' + String(Date.now()).slice(-4),
        year: 2099,
    };

    const createWithoutToken = await request('/api/semesters', {
        method: 'POST',
        body: JSON.stringify(createPayload),
    });
    assertStatus(createWithoutToken, 401, 'POST /api/semesters should reject missing token');
    logPass('POST /api/semesters rejects missing token');

    const createInvalidToken = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders('not-a-real-token'),
        body: JSON.stringify(createPayload),
    });
    assertStatus(createInvalidToken, 401, 'POST /api/semesters should reject invalid token');
    logPass('POST /api/semesters rejects invalid token');

    const createNonAdmin = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify(createPayload),
    });
    assertStatus(createNonAdmin, 403, 'POST /api/semesters should reject non-admin users');
    logPass('POST /api/semesters rejects non-admin users');

    const invalidCreate = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ term: '', year: 'invalid' }),
    });
    assertStatus(invalidCreate, 400, 'POST /api/semesters should reject invalid payloads');
    logPass('POST /api/semesters rejects invalid payloads');

    const createSemester = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(createPayload),
    });
    assertStatus(createSemester, 201, 'POST /api/semesters should allow admins to create semesters');
    const createdSemesterId = createSemester.body?.semester?.semester_id;
    assertTruthy(createdSemesterId, 'POST /api/semesters should return a created semester id', createSemester.body);
    assertEqual(createSemester.body?.semester?.term, createPayload.term, 'POST /api/semesters should persist term', createSemester.body);
    assertEqual(createSemester.body?.semester?.year, createPayload.year, 'POST /api/semesters should persist year', createSemester.body);
    logPass('POST /api/semesters allows admin users');

    const duplicateSemester = await request('/api/semesters', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(createPayload),
    });
    assertStatus(duplicateSemester, 409, 'POST /api/semesters should reject duplicate term and year pairs');
    logPass('POST /api/semesters rejects duplicates');

    const getSemester = await request('/api/semesters/' + createdSemesterId);
    assertStatus(getSemester, 200, 'GET /api/semesters/:semesterId should return created semesters');
    assertEqual(getSemester.body?.semester?.semester_id, createdSemesterId, 'GET /api/semesters/:semesterId should return the requested semester', getSemester.body);
    logPass('GET /api/semesters/:semesterId returns created semesters');

    const getMissingSemester = await request('/api/semesters/999999999');
    assertStatus(getMissingSemester, 404, 'GET /api/semesters/:semesterId should reject unknown semesters');
    logPass('GET /api/semesters/:semesterId rejects unknown semesters');

    const deleteWithoutToken = await request('/api/semesters/' + createdSemesterId, {
        method: 'DELETE',
    });
    assertStatus(deleteWithoutToken, 401, 'DELETE /api/semesters/:semesterId should reject missing token');
    logPass('DELETE /api/semesters/:semesterId rejects missing token');

    const deleteNonAdmin = await request('/api/semesters/' + createdSemesterId, {
        method: 'DELETE',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(deleteNonAdmin, 403, 'DELETE /api/semesters/:semesterId should reject non-admin users');
    logPass('DELETE /api/semesters/:semesterId rejects non-admin users');

    const deleteSemester = await request('/api/semesters/' + createdSemesterId, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteSemester, 200, 'DELETE /api/semesters/:semesterId should allow admins to delete semesters');
    logPass('DELETE /api/semesters/:semesterId allows admin users');

    const getAfterDelete = await request('/api/semesters/' + createdSemesterId);
    assertStatus(getAfterDelete, 404, 'GET /api/semesters/:semesterId should return 404 after deletion');
    logPass('GET /api/semesters/:semesterId returns 404 after deletion');
}
