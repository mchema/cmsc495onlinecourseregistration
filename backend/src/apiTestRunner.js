import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:3000';

const ADMIN_USER = {
    email: 'horne_chri87@gmail.com',
    password: 'R@k4RGAd9j9CcV@rfvCzX3CeLZo-',
};

const NEW_USER = {
    name: `API Test User ${Date.now()}`,
    email: `api_test_${Date.now()}@gmail.com`,
    password: 'Password',
};

const NEW_USER_UPDATED_PASSWORD = `UpdatedPass!${Date.now()}A1`;

const PASSWORD_POLICY_TESTS = {
    tooShort: 'Aa1!a',
    missingUppercase: 'lowercase1!',
    missingLowercase: 'UPPERCASE1!',
    missingNumber: 'NoNumber!',
    missingSpecial: 'NoSpecial1',
    containsEmailLocalPart: `${NEW_USER.email.split('@')[0]}!Aa1`,
};

let child;

// helpers
function logPass(message) {
    console.log(`PASS: ${message}`);
}

function logFail(message, extra = '') {
    console.error(`FAIL: ${message}`);
    if (extra) console.error(extra);
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`${BASE_URL}/api/health`);
            if (res.ok) {
                return true;
            }
        } catch {
            // ignore while waiting
        }

        await sleep(250);
    }

    return false;
}

async function request(path, options = {}) {
    const { headers = {}, ...rest } = options;

    const res = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });

    let body = null;

    try {
        body = await res.json();
    } catch {
        body = null;
    }

    return {
        status: res.status,
        ok: res.ok,
        body,
    };
}

async function loginAndGetAuth(email, password) {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (res.status !== 200) {
        throw new Error(`Login failed for ${email}. Status: ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    if (!res.body?.token) {
        throw new Error(`Missing token for ${email}. Body: ${JSON.stringify(res.body)}`);
    }

    return {
        token: res.body.token,
        user: res.body.user,
        firstLogin: res.body.firstLogin,
    };
}

function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
    };
}

// tests
async function testHealth() {
    const res = await request('/api/health');

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
    }

    if (!res.body || res.body.message !== 'API is running') {
        throw new Error(`Unexpected health body: ${JSON.stringify(res.body)}`);
    }

    logPass('GET /api/health returns 200');
}

async function testLoginMissingFields() {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}`);
    }

    logPass('POST /api/auth/login rejects missing credentials');
}

async function testLoginBadPassword() {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: ADMIN_USER.email,
            password: 'WrongPassword',
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/auth/login rejects invalid password');
}

async function testLoginBadEmail() {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: 'thisEmailDoesnt@exist.com',
            password: 'WrongPassword',
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/auth/login rejects invalid email');
}

async function testLoginSuccess() {
    const auth = await loginAndGetAuth(ADMIN_USER.email, ADMIN_USER.password);

    if (!auth.user?.email) {
        throw new Error(`Missing user payload: ${JSON.stringify(auth)}`);
    }

    if (auth.user.email !== ADMIN_USER.email) {
        throw new Error(`Unexpected email: ${JSON.stringify(auth)}`);
    }

    if (typeof auth.firstLogin !== 'boolean') {
        throw new Error(`Expected boolean firstLogin: ${JSON.stringify(auth)}`);
    }

    logPass('POST /api/auth/login accepts valid credentials and returns token');

    return auth;
}

async function testMeWithoutToken() {
    const res = await request('/api/auth/me');

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('GET /api/auth/me rejects missing token');
}

async function testMeWithInvalidToken() {
    const res = await request('/api/auth/me', {
        headers: authHeaders('not-a-real-token'),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('GET /api/auth/me rejects invalid token');
}

async function testMeWithValidToken(adminAuth) {
    const res = await request('/api/auth/me', {
        headers: authHeaders(adminAuth.token),
    });

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    if (!res.body?.user?.email) {
        throw new Error(`Missing /me user payload: ${JSON.stringify(res.body)}`);
    }

    if (res.body.user.email !== ADMIN_USER.email) {
        throw new Error(`Unexpected /me email: ${JSON.stringify(res.body)}`);
    }

    logPass('GET /api/auth/me returns current user for valid token');
}

async function testLogoutWithoutToken() {
    const res = await request('/api/auth/logout', {
        method: 'POST',
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/auth/logout rejects missing token');
}

async function testLogoutWithValidToken(adminAuth) {
    const res = await request('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(adminAuth.token),
    });

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/logout accepts valid token');
}

async function testChangePasswordWithoutToken() {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
            newPassword: 'SomeValidPassword123!',
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/auth/change-password rejects missing token');
}

async function testChangePasswordMissingPassword(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({}),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects missing new password');
}

async function testChangePasswordRejectsDefaultPassword(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: 'Password',
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects default password reuse');
}

async function testChangePasswordRejectsTooShortPassword(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.tooShort,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects too-short password');
}

async function testChangePasswordRejectsMissingUppercase(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.missingUppercase,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects password missing uppercase letter');
}

async function testChangePasswordRejectsMissingLowercase(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.missingLowercase,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects password missing lowercase letter');
}

async function testChangePasswordRejectsMissingNumber(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.missingNumber,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects password missing number');
}

async function testChangePasswordRejectsMissingSpecial(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.missingSpecial,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects password missing special character');
}

async function testChangePasswordRejectsEmailLocalPart(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: PASSWORD_POLICY_TESTS.containsEmailLocalPart,
        }),
    });

    if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password rejects password containing email local-part');
}

async function testChangePasswordSuccess(userAuth) {
    const res = await request('/api/auth/change-password', {
        method: 'POST',
        headers: authHeaders(userAuth.token),
        body: JSON.stringify({
            newPassword: NEW_USER_UPDATED_PASSWORD,
        }),
    });

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/auth/change-password accepts valid authenticated request');
}

async function testOldPasswordFailsAfterChange() {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: NEW_USER.email,
            password: NEW_USER.password,
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('Old password is rejected after password change');
}

async function testNewPasswordSucceedsAfterChange() {
    const auth = await loginAndGetAuth(NEW_USER.email, NEW_USER_UPDATED_PASSWORD);

    if (auth.user.email !== NEW_USER.email) {
        throw new Error(`Unexpected user email after password change: ${JSON.stringify(auth)}`);
    }

    if (auth.firstLogin !== false) {
        throw new Error(`Expected firstLogin false after password change: ${JSON.stringify(auth)}`);
    }

    logPass('New password is accepted after password change');

    return auth;
}

async function testAdminRouteWithoutToken() {
    const res = await request('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            name: NEW_USER.name,
            email: NEW_USER.email,
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/admin/users rejects missing token');
}

async function testAdminRouteWithInvalidToken() {
    const res = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders('not-a-real-token'),
        body: JSON.stringify({
            name: NEW_USER.name,
            email: NEW_USER.email,
        }),
    });

    if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
    }

    logPass('POST /api/admin/users rejects invalid token');
}

async function testAdminRouteWithAdminToken(adminAuth) {
    const res = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(adminAuth.token),
        body: JSON.stringify({
            name: NEW_USER.name,
            email: NEW_USER.email,
        }),
    });

    if (res.status !== 201) {
        throw new Error(`Expected 201, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/admin/users allows admin user');
}

async function testNewUserLoginSuccess() {
    const auth = await loginAndGetAuth(NEW_USER.email, NEW_USER.password);

    if (auth.user.email !== NEW_USER.email) {
        throw new Error(`Unexpected new user email: ${JSON.stringify(auth)}`);
    }

    if (auth.firstLogin !== true) {
        throw new Error(`Expected firstLogin true for new user: ${JSON.stringify(auth)}`);
    }

    logPass('Newly created user can log in with default first-login password');

    return auth;
}

async function testFirstLoginUserCanAccessMe(nonAdminAuth) {
    const res = await request('/api/auth/me', {
        headers: authHeaders(nonAdminAuth.token),
    });

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    if (res.body?.user?.email !== NEW_USER.email) {
        throw new Error(`Unexpected /me user payload for first-login user: ${JSON.stringify(res.body)}`);
    }

    logPass('First-login user can access GET /api/auth/me');
}

async function testFirstLoginUserCanLogout(nonAdminAuth) {
    const res = await request('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(nonAdminAuth.token),
    });

    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('First-login user can access POST /api/auth/logout');
}

async function testFirstLoginUserIsBlockedFromAdminRoutes(nonAdminAuth) {
    const res = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(nonAdminAuth.token),
        body: JSON.stringify({
            name: `Blocked First Login User ${Date.now()}`,
            email: `blocked_first_login_${Date.now()}@gmail.com`,
        }),
    });

    if (res.status !== 403) {
        throw new Error(`Expected 403, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('First-login user is blocked from admin routes before password change');
}

async function testAdminRouteWithNonAdminToken(nonAdminAuth) {
    const res = await request('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(nonAdminAuth.token),
        body: JSON.stringify({
            name: `Forbidden User ${Date.now()}`,
            email: `forbidden_${Date.now()}@gmail.com`,
        }),
    });

    if (res.status !== 403) {
        throw new Error(`Expected 403, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    }

    logPass('POST /api/admin/users rejects non-admin user');
}

// runner
async function main() {
    child = spawn('node', ['./backend/src/server.js'], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');

    child.stdout.on('data', (data) => {
        process.stdout.write(`[server] ${data}`);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(`[server:err] ${data}`);
    });

    const ready = await waitForServer();

    if (!ready) {
        throw new Error('Server did not become ready in time.');
    }

    await testHealth();
    await testLoginMissingFields();
    await testLoginBadPassword();
    await testLoginBadEmail();

    const adminAuth = await testLoginSuccess();

    await testMeWithoutToken();
    await testMeWithInvalidToken();
    await testMeWithValidToken(adminAuth);

    await testLogoutWithoutToken();
    await testLogoutWithValidToken(adminAuth);

    await testAdminRouteWithoutToken();
    await testAdminRouteWithInvalidToken();
    await testAdminRouteWithAdminToken(adminAuth);

    const nonAdminAuth = await testNewUserLoginSuccess();
    await testFirstLoginUserCanAccessMe(nonAdminAuth);
    await testFirstLoginUserCanLogout(nonAdminAuth);
    await testFirstLoginUserIsBlockedFromAdminRoutes(nonAdminAuth);

    await testChangePasswordWithoutToken();
    await testChangePasswordMissingPassword(nonAdminAuth);
    await testChangePasswordRejectsDefaultPassword(nonAdminAuth);
    await testChangePasswordRejectsTooShortPassword(nonAdminAuth);
    await testChangePasswordRejectsMissingUppercase(nonAdminAuth);
    await testChangePasswordRejectsMissingLowercase(nonAdminAuth);
    await testChangePasswordRejectsMissingNumber(nonAdminAuth);
    await testChangePasswordRejectsMissingSpecial(nonAdminAuth);
    await testChangePasswordRejectsEmailLocalPart(nonAdminAuth);
    await testChangePasswordSuccess(nonAdminAuth);
    await testOldPasswordFailsAfterChange();
    const updatedNonAdminAuth = await testNewPasswordSucceedsAfterChange();
    await testAdminRouteWithNonAdminToken(updatedNonAdminAuth);

    console.log('\nAll tests completed.');
}

main()
    .catch((err) => {
        logFail('Test runner failed', err.stack || err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (child) {
            child.kill('SIGINT');
            await sleep(500);
        }
    });
