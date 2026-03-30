import { assertEqual, assertStatus } from '../assert.js';
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
            userType: 'student',
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
            userType: 'student',
            roleDetails: 'STUDENT',
        }),
    });

    assertStatus(withNonAdminToken, 403, 'POST /api/admin/users should reject non-admin user');
    logPass('POST /api/admin/users rejects non-admin user');
}
