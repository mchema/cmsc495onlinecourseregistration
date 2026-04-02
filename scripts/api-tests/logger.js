import { API_TEST_VERBOSE } from './config.js';

export function logPass(message) {
    if (API_TEST_VERBOSE) {
        console.log(`PASS: ${message}`);
    }
}

export function logFail(message, extra = '') {
    console.error(`FAIL: ${message}`);
    if (extra) console.error(extra);
}

export function logInfo(message) {
    if (API_TEST_VERBOSE) {
        console.log(`INFO: ${message}`);
    }
}
