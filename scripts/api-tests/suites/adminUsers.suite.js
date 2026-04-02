import { assertEqual, assertStatus, assertTruthy } from '../assert.js';
import { authHeaders } from '../http.js';
import { loginAndGetAuth } from '../auth.js';
import { logPass } from '../logger.js';

export async function runAdminUsersSuite(ctx, request) {
    const userPayload = {
        name: ctx.newUser.name,
        email: ctx.newUser.email,
        userType: ctx.newUser.userType,
        roleDetails: 'STUDENT',
    };

    const withoutToken = await request('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userPayload),
    });
    assertStatus(withoutToken, 401, 'POST /api/admin/users should reject missing token');
    logPass('POST /api/admin/users rejects missing token');

    const withInvalidToken = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders('not-a-real-token'),
        body: JSON.stringify(userPayload),
    });
    assertStatus(withInvalidToken, 401, 'POST /api/admin/users should reject invalid token');
    logPass('POST /api/admin/users rejects invalid token');

    const withAdminToken = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(userPayload),
    });
    assertStatus(withAdminToken, 201, 'POST /api/admin/users should allow admin user');
    logPass('POST /api/admin/users allows admin user');

    ctx.nonAdminAuth = await loginAndGetAuth(request, ctx.newUser.email, ctx.newUser.password);
    assertEqual(ctx.nonAdminAuth.user?.email, ctx.newUser.email, 'Unexpected new user email', ctx.nonAdminAuth);
    assertEqual(ctx.nonAdminAuth.firstLogin, true, 'Expected firstLogin true for new user', ctx.nonAdminAuth);
    logPass('Newly created user can log in with default first-login password');

    const firstLoginCanAccessMe = await request('/api/auth/me', {
        headers: authHeaders(ctx.nonAdminAuth.token),
    });
    assertStatus(firstLoginCanAccessMe, 200, 'First-login user should access GET /api/auth/me');
    assertEqual(firstLoginCanAccessMe.body?.user?.email, ctx.newUser.email, 'Unexpected /me payload for first-login user', firstLoginCanAccessMe.body);
    logPass('First-login user can access GET /api/auth/me');

    const firstLoginCanLogout = await request('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(ctx.nonAdminAuth.token),
    });
    assertStatus(firstLoginCanLogout, 200, 'First-login user should access POST /api/auth/logout');
    logPass('First-login user can access POST /api/auth/logout');

    const firstLoginBlockedFromAdmin = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.nonAdminAuth.token),
        body: JSON.stringify({
            name: `Blocked First Login User ${Date.now()}`,
            email: `blocked_first_login_${Date.now()}@gmail.com`,
            userType: 'STUDENT',
            roleDetails: 'STUDENT',
        }),
    });
    assertStatus(firstLoginBlockedFromAdmin, 403, 'First-login user should be blocked from admin routes');
    logPass('First-login user is blocked from admin routes before password change');
}

export async function runPostPasswordAdminChecks(ctx, request) {
    const withNonAdminToken = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
        body: JSON.stringify({
            name: `Forbidden User ${Date.now()}`,
            email: `forbidden_${Date.now()}@gmail.com`,
            userType: 'STUDENT',
            roleDetails: 'STUDENT',
        }),
    });

    assertStatus(withNonAdminToken, 403, 'POST /api/admin/users should reject non-admin user');
    logPass('POST /api/admin/users rejects non-admin user');
}

export async function runAdminReadWriteSuite(ctx, request) {
    const listWithoutToken = await request('/api/admin/users');
    assertStatus(listWithoutToken, 401, 'GET /api/admin/users should reject missing token');
    logPass('GET /api/admin/users rejects missing token');

    const listWithInvalidToken = await request('/api/admin/users', {
        headers: authHeaders('not-a-real-token'),
    });
    assertStatus(listWithInvalidToken, 401, 'GET /api/admin/users should reject invalid token');
    logPass('GET /api/admin/users rejects invalid token');

    const listWithNonAdminToken = await request('/api/admin/users', {
        headers: authHeaders(ctx.updatedNonAdminAuth.token),
    });
    assertStatus(listWithNonAdminToken, 403, 'GET /api/admin/users should reject non-admin user');
    logPass('GET /api/admin/users rejects non-admin user');

    const invalidPagination = await request('/api/admin/users?page=-1&limit=0&search=@gmail.com', {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(invalidPagination, 400, 'GET /api/admin/users should reject invalid pagination values');
    logPass('GET /api/admin/users rejects invalid pagination values');

    const paginatedList = await request('/api/admin/users?page=1&limit=10&search=@gmail.com', {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(paginatedList, 200, 'GET /api/admin/users should allow admin user');
    assertTruthy(Array.isArray(paginatedList.body?.users), 'GET /api/admin/users should return a users array', paginatedList.body);
    assertEqual(paginatedList.body?.meta?.page, 1, 'GET /api/admin/users should return requested page', paginatedList.body);
    assertEqual(paginatedList.body?.meta?.limit, 10, 'GET /api/admin/users should return requested limit', paginatedList.body);
    assertTruthy(typeof paginatedList.body?.meta?.totalPages === 'number', 'GET /api/admin/users should return totalPages', paginatedList.body);
    assertTruthy(typeof paginatedList.body?.users?.[0]?.role === 'string', 'GET /api/admin/users should include role details', paginatedList.body);
    logPass('GET /api/admin/users returns paginated admin results');

    const filteredStudents = await request('/api/admin/users?role=STUDENT&search=' + encodeURIComponent(ctx.updatedUserProfile.email), {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(filteredStudents, 200, 'GET /api/admin/users should support role filtering');
    assertTruthy(
        filteredStudents.body?.users?.some((user) => user.email === ctx.updatedUserProfile.email),
        'Role-filtered user list should contain the updated student user',
        filteredStudents.body
    );
    logPass('GET /api/admin/users supports search and role filtering');

    const invalidRoleFilter = await request('/api/admin/users?role=invalid-role', {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(invalidRoleFilter, 400, 'GET /api/admin/users should reject invalid role filters');
    logPass('GET /api/admin/users rejects invalid role filters');

    const managedUserPayload = {
        name: `Managed User ${Date.now()}`,
        email: `managed_user_${Date.now()}@gmail.com`,
        userType: 'STUDENT',
        roleDetails: 'STUDENT',
    };

    const createManagedUser = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify(managedUserPayload),
    });
    assertStatus(createManagedUser, 201, 'POST /api/admin/users should create a managed user for admin read/write tests');

    const findManagedUser = await request('/api/admin/users?search=' + encodeURIComponent(managedUserPayload.email), {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(findManagedUser, 200, 'GET /api/admin/users should find created managed user');
    const managedUser = findManagedUser.body?.users?.find((user) => user.email === managedUserPayload.email);
    assertTruthy(managedUser?.id, 'Managed user should be discoverable through GET /api/admin/users', findManagedUser.body);
    logPass('GET /api/admin/users can locate newly created users');

    const getByIdWithoutToken = await request(`/api/admin/users/${managedUser.id}`);
    assertStatus(getByIdWithoutToken, 401, 'GET /api/admin/users/:id should reject missing token');
    logPass('GET /api/admin/users/:id rejects missing token');

    const getByIdWithAdmin = await request(`/api/admin/users/${managedUser.id}`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getByIdWithAdmin, 200, 'GET /api/admin/users/:id should allow admin user');
    assertEqual(getByIdWithAdmin.body?.user?.email, managedUserPayload.email, 'GET /api/admin/users/:id returned the wrong user', getByIdWithAdmin.body);
    assertEqual(getByIdWithAdmin.body?.user?.role, 'STUDENT', 'GET /api/admin/users/:id should return role details', getByIdWithAdmin.body);
    logPass('GET /api/admin/users/:id returns the requested user');

    const patchRoleWithoutToken = await request(`/api/admin/users/${managedUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ userType: 'PROFESSOR', roleDetails: 'Computer Science' }),
    });
    assertStatus(patchRoleWithoutToken, 401, 'PATCH /api/admin/users/:id/role should reject missing token');
    logPass('PATCH /api/admin/users/:id/role rejects missing token');

    const patchRoleWithAdmin = await request(`/api/admin/users/${managedUser.id}/role`, {
        method: 'PATCH',
        headers: authHeaders(ctx.adminAuth.token),
        body: JSON.stringify({ userType: 'PROFESSOR', roleDetails: 'Computer Science' }),
    });
    assertStatus(patchRoleWithAdmin, 200, 'PATCH /api/admin/users/:id/role should allow admin user');
    logPass('PATCH /api/admin/users/:id/role allows admin user');

    const getByIdAfterRoleUpdate = await request(`/api/admin/users/${managedUser.id}`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getByIdAfterRoleUpdate, 200, 'GET /api/admin/users/:id should allow admin user after role update');
    assertEqual(getByIdAfterRoleUpdate.body?.user?.role, 'PROFESSOR', 'PATCH /api/admin/users/:id/role should update returned role details', getByIdAfterRoleUpdate.body);
    assertEqual(getByIdAfterRoleUpdate.body?.user?.role_details, 'Computer Science', 'PATCH /api/admin/users/:id/role should update returned role details payload', getByIdAfterRoleUpdate.body);
    logPass('PATCH /api/admin/users/:id/role updates role details visible via GET /api/admin/users/:id');

    const selfDeleteBlocked = await request('/api/admin/users/' + ctx.adminAuth.user.id, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(selfDeleteBlocked, 403, 'DELETE /api/admin/users/:id should reject self-deletion by admin');
    logPass('DELETE /api/admin/users/:id rejects self-deletion by admin');

    const deleteWithoutToken = await request(`/api/admin/users/${managedUser.id}`, {
        method: 'DELETE',
    });
    assertStatus(deleteWithoutToken, 401, 'DELETE /api/admin/users/:id should reject missing token');
    logPass('DELETE /api/admin/users/:id rejects missing token');

    const deleteWithAdmin = await request(`/api/admin/users/${managedUser.id}`, {
        method: 'DELETE',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(deleteWithAdmin, 200, 'DELETE /api/admin/users/:id should allow admin user');
    logPass('DELETE /api/admin/users/:id allows admin user');

    const getDeletedUser = await request(`/api/admin/users/${managedUser.id}`, {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(getDeletedUser, 404, 'GET /api/admin/users/:id should return 404 after deletion');
    logPass('GET /api/admin/users/:id returns 404 after deletion');
}
