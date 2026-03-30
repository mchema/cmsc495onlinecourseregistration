import { ADMIN_USER } from './config.js';
import { assertEqual, assertStatus, assertTruthy } from './assert.js';
import { authHeaders } from './http.js';
import { logPass } from './logger.js';

export async function loginAndGetAuth(request, email, password) {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    assertStatus(res, 200, `Login failed for ${email}`);
    assertTruthy(res.body?.token, `Missing token for ${email}`, res.body);

    return {
        token: res.body.token,
        user: res.body.user,
        firstLogin: res.body.firstLogin,
    };
}

export async function runAuthSuite(ctx, request) {
    const health = await request('/api/health');
    assertStatus(health, 200, 'GET /api/health failed');
    assertEqual(health.body?.message, 'API is running', 'Unexpected health body', health.body);
    logPass('GET /api/health returns 200');

    const missingCredentials = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
    });
    assertStatus(missingCredentials, 400, 'POST /api/auth/login should reject missing credentials');
    logPass('POST /api/auth/login rejects missing credentials');

    const badPassword = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: ADMIN_USER.email, password: 'WrongPassword' }),
    });
    assertStatus(badPassword, 401, 'POST /api/auth/login should reject invalid password');
    logPass('POST /api/auth/login rejects invalid password');

    const badEmail = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'thisEmailDoesnt@exist.com', password: 'WrongPassword' }),
    });
    assertStatus(badEmail, 401, 'POST /api/auth/login should reject invalid email');
    logPass('POST /api/auth/login rejects invalid email');

    ctx.adminAuth = await loginAndGetAuth(request, ADMIN_USER.email, ADMIN_USER.password);
    assertTruthy(ctx.adminAuth.user?.email, 'Missing user payload on admin login', ctx.adminAuth);
    assertEqual(ctx.adminAuth.user.email, ADMIN_USER.email, 'Unexpected admin email after login', ctx.adminAuth);
    if (typeof ctx.adminAuth.firstLogin !== 'boolean') {
        throw new Error(`Expected boolean firstLogin. Payload: ${JSON.stringify(ctx.adminAuth)}`);
    }
    logPass('POST /api/auth/login accepts valid credentials and returns token');

    const meWithoutToken = await request('/api/auth/me');
    assertStatus(meWithoutToken, 401, 'GET /api/auth/me should reject missing token');
    logPass('GET /api/auth/me rejects missing token');

    const meWithInvalidToken = await request('/api/auth/me', {
        headers: authHeaders('not-a-real-token'),
    });
    assertStatus(meWithInvalidToken, 401, 'GET /api/auth/me should reject invalid token');
    logPass('GET /api/auth/me rejects invalid token');

    const meWithValidToken = await request('/api/auth/me', {
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(meWithValidToken, 200, 'GET /api/auth/me should return current user');
    assertTruthy(meWithValidToken.body?.user?.email, 'Missing /me user payload', meWithValidToken.body);
    assertEqual(meWithValidToken.body.user.email, ADMIN_USER.email, 'Unexpected /me email', meWithValidToken.body);
    logPass('GET /api/auth/me returns current user for valid token');

    const logoutWithoutToken = await request('/api/auth/logout', { method: 'POST' });
    assertStatus(logoutWithoutToken, 401, 'POST /api/auth/logout should reject missing token');
    logPass('POST /api/auth/logout rejects missing token');

    const logoutWithValidToken = await request('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(ctx.adminAuth.token),
    });
    assertStatus(logoutWithValidToken, 200, 'POST /api/auth/logout should accept valid token');
    logPass('POST /api/auth/logout accepts valid token');
}

export async function runPasswordSuite(ctx, request) {
    const changePasswordWithoutToken = await request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: 'SomeValidPassword123!' }),
    });
    assertStatus(changePasswordWithoutToken, 401, 'POST /api/auth/change-password should reject missing token');
    logPass('POST /api/auth/change-password rejects missing token');

    const changePasswordMissingPassword = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(ctx.nonAdminAuth.token),
        body: JSON.stringify({}),
    });
    assertStatus(changePasswordMissingPassword, 400, 'POST /api/auth/change-password should reject missing new password');
    logPass('POST /api/auth/change-password rejects missing new password');

    const policyCases = [
        ['Password', 'POST /api/auth/change-password rejects default password reuse'],
        [ctx.passwordPolicyTests.tooShort, 'POST /api/auth/change-password rejects too-short password'],
        [ctx.passwordPolicyTests.missingUppercase, 'POST /api/auth/change-password rejects password missing uppercase letter'],
        [ctx.passwordPolicyTests.missingLowercase, 'POST /api/auth/change-password rejects password missing lowercase letter'],
        [ctx.passwordPolicyTests.missingNumber, 'POST /api/auth/change-password rejects password missing number'],
        [ctx.passwordPolicyTests.missingSpecial, 'POST /api/auth/change-password rejects password missing special character'],
        [ctx.passwordPolicyTests.containsEmailLocalPart, 'POST /api/auth/change-password rejects password containing email local-part'],
    ];

    for (const [newPassword, successMessage] of policyCases) {
        const res = await request('/api/auth/change-password', {
            method: 'POST',
            headers: authHeaders(ctx.nonAdminAuth.token),
            body: JSON.stringify({ newPassword }),
        });
        assertStatus(res, 400, `${successMessage} failed`);
        logPass(successMessage);
    }

    const validPasswordChange = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(ctx.nonAdminAuth.token),
        body: JSON.stringify({ newPassword: ctx.newUserUpdatedPassword }),
    });
    assertStatus(validPasswordChange, 200, 'POST /api/auth/change-password should accept valid request');
    logPass('POST /api/auth/change-password accepts valid authenticated request');

    const oldPasswordRejected = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: ctx.newUser.email,
            password: ctx.newUser.password,
        }),
    });
    assertStatus(oldPasswordRejected, 401, 'Old password should be rejected after password change');
    logPass('Old password is rejected after password change');

    ctx.updatedNonAdminAuth = await loginAndGetAuth(request, ctx.newUser.email, ctx.newUserUpdatedPassword);
    assertEqual(ctx.updatedNonAdminAuth.user?.email, ctx.newUser.email, 'Unexpected user after password change', ctx.updatedNonAdminAuth);
    assertEqual(ctx.updatedNonAdminAuth.firstLogin, false, 'Expected firstLogin false after password change', ctx.updatedNonAdminAuth);
    logPass('New password is accepted after password change');
}
