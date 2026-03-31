import { BASE_URL, RUN_COURSE_SUITE, SERVER_ENTRY, SERVER_READY_TIMEOUT_MS } from './config.js';
import { request as rawRequest } from './http.js';
import { createTestContext } from './fixtures.js';
import { logFail } from './logger.js';
import { runAuthSuite, runPasswordSuite, runUpdateUserInfoSuite } from './auth.js';
import { runAdminReadWriteSuite, runAdminUsersSuite, runPostPasswordAdminChecks } from './suites/adminUsers.suite.js';
import { runCoursesSuite } from './suites/courses.suite.js';
import { startServer, stopServer, waitForServer } from './serverLifecycle.js';
import { close as closeDb } from '../../db/connection.js';

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
        await runUpdateUserInfoSuite(ctx, request);
        await runPostPasswordAdminChecks(ctx, request);
        await runAdminReadWriteSuite(ctx, request);
        if (RUN_COURSE_SUITE !== 'false') {
            await runCoursesSuite(ctx, request);
        }
        console.log('All tests passed.');
    } catch (err) {
        const serverLogs = typeof child?.getBufferedLogs === 'function' ? child.getBufferedLogs().trim() : '';
        logFail('Test runner failed', err.stack || err.message);
        if (serverLogs) {
            console.error('\nServer output:\n' + serverLogs);
        }
        process.exitCode = 1;
    } finally {
        await stopServer(child);
        await closeDb();
    }
}
