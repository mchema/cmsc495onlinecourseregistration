import { BASE_URL, RUN_COURSE_SUITE, SERVER_ENTRY, SERVER_READY_TIMEOUT_MS } from './config.js';
import { request as rawRequest } from './http.js';
import { createTestContext } from './fixtures.js';
import { logFail, logInfo } from './logger.js';
import { runAuthSuite, runPasswordSuite } from './auth.js';
import { runAdminUsersSuite, runPostPasswordAdminChecks } from './suites/adminUsers.suite.js';
import { runCoursesSuite } from './suites/courses.suite.js';
import { startServer, stopServer, waitForServer } from './serverLifecycle.js';

export async function runApiTests() {
    const ctx = createTestContext();
    const request = (path, options) => rawRequest(BASE_URL, path, options);

    let child;

    try {
        child = startServer(SERVER_ENTRY);

        const ready = await waitForServer(BASE_URL, SERVER_READY_TIMEOUT_MS);
        if (!ready) {
            throw new Error('Server did not become ready in time.');
        }

        await runAuthSuite(ctx, request);
        await runAdminUsersSuite(ctx, request);
        await runPasswordSuite(ctx, request);
        await runPostPasswordAdminChecks(ctx, request);
        const shouldRunCourses = await shouldRunCourseSuite(request);
        if (shouldRunCourses) {
            await runCoursesSuite(ctx, request);
        } else {
            logInfo('Skipping course suite: /api/courses route is unavailable or disabled.');
        }

        logInfo('All tests completed.');
    } catch (err) {
        logFail('Test runner failed', err.stack || err.message);
        process.exitCode = 1;
    } finally {
        await stopServer(child);
    }
}

async function shouldRunCourseSuite(request) {
    if (RUN_COURSE_SUITE === 'false') {
        return false;
    }

    if (RUN_COURSE_SUITE === 'true') {
        return true;
    }

    // auto mode: run the suite only if the route appears mounted.
    const probe = await request('/api/courses', {
        method: 'POST',
        body: JSON.stringify({}),
    });

    return probe.status !== 404;
}
